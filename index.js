import express from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' assert { type: "json" };

const app = express();
const PORT = process.env.PORT || 8000;
const PATH_SEARCH_USERS = 'https://api.github.com/search/users';
const BASE_PATH_USERS = 'https://api.github.com/users';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * Fetch users from Github based on search query
 * @param {string} query - search query
 * @returns {Promise<Array>} - list of Github users
 */
async function fetchGithubUsers(query) {
  const response = await fetch(`${PATH_SEARCH_USERS}?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Github API request failed');

  const data = await response.json();
  return data.items.slice(0, 5);
}

/**
 * Fetch recent repositories of a Github user
 * @param {string} username - Github username
 * @returns {Promise<Array>} - list of (max. 5) Github repositories
 */
async function fetchUserRepos(username) {
  const repoResponse = await fetch(`${BASE_PATH_USERS}/${username}/repos?sort=updated&per_page=5`);
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
    const enrichedUsers = await Promise.all(users.map(async user => {
      const repos = await fetchUserRepos(user.login);

      return {
        username: user.login,
        repos: repos.map(repo => ({ name: repo.name, url: repo.html_url }))
      };
    }));

    res.status(StatusCodes.OK).json(enrichedUsers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});