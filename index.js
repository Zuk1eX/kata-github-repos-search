class View {
  constructor(search) {
    this.search = search;
    this.app = document.querySelector(".app");
    this.searchInput = this.app.querySelector(".search-input");
    this.resultBox = this.app.querySelector(".result-box");
    this.resultList = this.resultBox.querySelector(".result-box__list");
    this.emptyResultBox = this.resultBox.querySelector(".result-box__empty");
    this.selectedRepos = this.app.querySelector(".selected-repos");
    this.selectedReposList = this.selectedRepos.querySelector(
      ".selected-repos__list"
    );

    this.debounceTime = 400;
    this.searchTimer = null;
    this.selectedReposVault = [];

    this.getSelectedRepos();
    this.addEventListeners();
  }

  addEventListeners() {
    this.searchInput.addEventListener(
      "keyup",
      this.searchInputHandler.bind(this)
    );
    this.resultList.addEventListener(
      "click",
      this.resultListHandler.bind(this)
    );

    this.selectedReposList.addEventListener(
      "click",
      this.selectedReposListHandler.bind(this)
    );
  }

  getSelectedRepos() {
    let repos = localStorage.getItem("selectedRepos");
    if (repos) {
      this.selectedReposVault = JSON.parse(repos);
      this.renderSelectedRepos();
    }
  }

  setSelectedRepos(repo) {
    if (repo) {
      this.selectedReposVault.push(repo);
    }

    localStorage.setItem(
      "selectedRepos",
      JSON.stringify(this.selectedReposVault)
    );
  }

  renderSelectedRepos(repos) {
    this.selectedReposVault.forEach((repo) => {
      const element = this.createRepoCard(repo);
      this.selectedReposList.prepend(element);
    });
  }

  createElement(tagName, classNames) {
    const element = document.createElement(tagName);
    if (classNames.length) {
      classNames.forEach((className) => {
        element.classList.add(className);
      });
    }
    return element;
  }

  createRepoCard(repo) {
    const element = this.createElement("li", [
      "selected-repos__list-item",
      "repo-card",
    ]);
    element.insertAdjacentHTML(
      "afterbegin",
      `
			<div class="repo-card__info">
				<p class="repo-card__name">Name: <b>${repo.name}</b></p>
				<p class="repo-card__owner">Owner: ${repo.owner}</p>
				<p class="repo-card__stars">Stars: ${repo.stars}</p>
			</div>
			<button type="button" class="repo-card__del-btn" title="Remove repo ${repo.name}"></button>
			`
    );
    return element;
  }

  selectedReposListHandler(event) {
    if (event.target.tagName !== "BUTTON") return;

    event.target.parentElement.remove();
    this.selectedReposVault.pop();
    this.setSelectedRepos();
  }

  resultListHandler(event) {
    const repo = this.search.repos.find(
      ({ id }) => id === +event.target.dataset.id
    );
    const element = this.createRepoCard(repo);

    this.clearResultList();
    this.selectedReposList.prepend(element);
    this.setSelectedRepos(repo);
  }

  clearResultList() {
    this.searchInput.value = "";
    this.resultBox.classList.add("hidden");
  }

  searchInputHandler() {
    clearTimeout(this.searchTimer);
    const searchString = this.searchInput.value.trim();

    if (!searchString) {
      this.resultBox.classList.add("hidden");
      return;
    }

    this.searchTimer = setTimeout(async () => {
      await this.search.getRepos(searchString);
      this.renderResults();
    }, this.debounceTime);
  }

  renderResults() {
    if (!this.searchInput.value.trim()) return;

    this.resultBox.classList.remove("hidden");
    this.resultList.innerHTML = "";

    if (!this.search.repos.length) {
      this.emptyResultBox.classList.remove("hidden");
      return;
    }

    this.emptyResultBox.classList.add("hidden");
    this.search.repos.forEach(({ id, name }) => {
      const element = this.createElement("li", ["result-box__list-item"]);
      element.textContent = name;
      element.dataset.id = id;
      this.resultList.append(element);
    });
  }
}

class Search {
  constructor() {
    this.apiProvider = "https://api.github.com";
    this.repos = [];
  }

  async fetchRepos(searchString, amount = 5) {
    const params = new URLSearchParams({
      q: searchString,
      per_page: amount,
    }).toString();
    const response = await fetch(
      `${this.apiProvider}/search/repositories?${params}`
    );

    return response.json();
  }

  async getRepos(searchString) {
    if (!searchString) return;

    const data = await this.fetchRepos(searchString);
    this.repos = data.items.map(
      ({ id, name, stargazers_count: stars, owner: { login: owner } }) => ({
        id,
        name,
        stars,
        owner,
      })
    );
  }
}

new View(new Search());
