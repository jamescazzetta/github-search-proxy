import express from 'express';

const app = express();
const PORT = process.env.PORT || 8000;
const PATH_SEARCH_USERS = 'https://api.github.com/search/users';
const BASE_PATH_USERS = 'https://api.github.com/users';

// searches users and maps user repos to the response @todo: add documentation, maybe swagger
app.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    const response = await fetch(`${PATH_SEARCH_USERS}?q=${encodeURIComponent(q)}`);
    if (!response.ok) {
      return res.status(response.status).json({ message: 'GitHub API request failed' });
    }

    const data = await response.json();
    const users = data.items.slice(0, 5);

    const enrichedUsers = await Promise.all(users.map(async user => {
      const repoResponse = await fetch(`${BASE_PATH_USERS}/${user.login}/repos?sort=updated&per_page=5`);
      const repos = await repoResponse.json();

      return {
        username: user.login,
        repos: repos.map(repo => ({ name: repo.name, url: repo.html_url }))
      };
    }));

    res.json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});