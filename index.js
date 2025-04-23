import express from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';

// set up server
const app = express();
const PORT = process.env.PORT || 8000;

// set limits
const MAX_USERS = 5;
const MAX_REPOS = 5;

// cache responses for 5 minutes
const CACHE_CONTROL = 'public, max-age=300';

const PATH_SEARCH_USERS = 'https://api.github.com/search/users';
const BASE_PATH_USERS = 'https://api.github.com/users';

// setup Swagger documentation
const swaggerDocument = {
  swagger: '2.0',
  info: {
    title: 'Github Proxy API',
    version: '1.0.0',
  },
  paths: {
    '/search': {
      get: {
        summary: 'Search Github users and their repositories',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Github username search query',
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'Successful Response',
          },
          500: {
            description: 'Internal Server Error',
          },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * Fetch users from Github based on search query
 * @param {string} query - search query
 * @returns {Promise<Array>} - list of Github users
 */
async function fetchGithubUsers(query) {
  const response = await fetch(
    `${PATH_SEARCH_USERS}?q=${encodeURIComponent(query)}`,
    {
      headers: { 'Cache-Control': CACHE_CONTROL },
    }
  );
  if (!response.ok) throw new Error('Github API request failed');

  const data = await response.json();
  return data.items.slice(0, MAX_USERS);
}

/**
 * Fetch recent repositories of a Github user
 * @param {string} username - Github username
 * @returns {Promise<Array>} - list of (max. 5) Github repositories
 */
async function fetchUserRepos(username) {
  const repoResponse = await fetch(
    `${BASE_PATH_USERS}/${username}/repos?sort=updated&per_page=${MAX_REPOS}`,
    {
      headers: { 'Cache-Control': CACHE_CONTROL },
    }
  );
  if (!repoResponse.ok) throw new Error('Failed to fetch user repositories');

  return await repoResponse.json();
}

/**
 * API endpoint to search Github users and their recent repositories
 */
app.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    const users = await fetchGithubUsers(q);
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const repos = await fetchUserRepos(user.login);

        return {
          username: user.login,
          repos: repos.map((repo) => ({ name: repo.name, url: repo.html_url })),
        };
      })
    );

    res.set('Cache-Control', CACHE_CONTROL);
    res.status(StatusCodes.OK).json(enrichedUsers);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
