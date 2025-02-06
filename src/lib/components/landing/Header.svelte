<script lang="ts">
  export let onDrawerToggle: () => void;
</script>

<header>
  <div class="content">
    <div class="logo">NotAIry</div>
    <nav class="desktop-nav">
      <a href="#features">Features</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
    <div class="auth">
      <button class="login-button">Sign Up</button>
    </div>
    <button class="menu" on:click={onDrawerToggle}>
      <span>Menu</span>
    </button>
  </div>
</header>

<style>
  header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: #161616;
    padding: 20px;
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    color: white;
    font-weight: bold;
    font-size: 24px;
  }

  .desktop-nav {
    display: none;
    gap: 32px;
  }

  .desktop-nav a {
    color: white;
    text-decoration: none;
    font-size: 16px;
    transition: opacity 0.2s;
  }

  .desktop-nav a:hover {
    opacity: 0.8;
  }

  .auth button {
    background: none;
    border: 1px solid white;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .auth button:hover {
    background: white;
    color: #161616;
  }

  .menu {
    display: block;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
  }

  @media (min-width: 768px) {
    .desktop-nav {
      display: flex;
    }

    .menu {
      display: none;
    }
  }
</style> 