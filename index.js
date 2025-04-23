const express = require('express');
// @todo: maybe replace this with fetch later on.
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8000;
const PATH_SEARCH_USERS = 'https://api.github.com/search/users';
const BASE_PATH_USERS = 'https://api.github.com/users';

// searches users and maps user repos to the response @todo: add documentation, maybe swagger
app.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    const { data } = await axios.get(PATH_SEARCH_USERS, { params: { q } });
    const users = data.items.slice(0, 5);

    const enrichedUsers = await Promise.all(users.map(async user => {
      const repoRes = await axios.get(`${BASE_PATH_USERS}/${user.login}/repos`, {
        params: { sort: 'updated', per_page: 5 }
      });

      return {
        username: user.login,
        repos: repoRes.data.map(repo => ({ name: repo.name, url: repo.html_url }))
      };
    }));

    res.json(enrichedUsers);
  } catch (error) {
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});