<script lang="ts">
  export let isOpen: boolean;
  export let onDrawerClose: () => void;
</script>

<div class="drawer" class:open={isOpen}>
  <button class="close" on:click={onDrawerClose}>×</button>
  <nav>
    <!-- Add your navigation items here -->
  </nav>
</div>

<style>
  .drawer {
    position: fixed;
    top: 0;
    right: -100%;
    width: 100%;
    height: 100vh;
    background: #161616;
    transition: right 0.3s ease;
    z-index: 1000;
  }

  .drawer.open {
    right: 0;
  }

  .close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
  }
</style> 