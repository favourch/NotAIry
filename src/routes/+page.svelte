<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Drawer from '$lib/components/landing/Drawer.svelte';
  import Header from '$lib/components/landing/Header.svelte';
  import Top from '$lib/components/landing/Top.svelte';
  import Functions from '$lib/components/landing/Functions.svelte';
  import { createWallet } from '$lib/privy';

  let isAuthenticated = false;
  let user: any = null;
  let isDrawerOpen = false;

  function handleDrawerToggle() {
    isDrawerOpen = !isDrawerOpen;
  }

  async function handleLogin() {
    try {
      const wallet = await createWallet();
      if (wallet?.id) {
        goto('/dashboard');
      }
    } catch (error) {
      console.error('Failed to login:', error);
    }
  }
</script>

<svelte:head>
  <title>NotAIry - Onchain Storytelling for Startups</title>
</svelte:head>

<div class="wrapper">
  <Drawer isOpen={isDrawerOpen} onDrawerClose={handleDrawerToggle} />
  <Header onDrawerToggle={handleDrawerToggle} />
  <Top />
  <Functions />
</div>

<style>
  :global(body) {
    background: #161616;
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  nav {
    padding: 1.25rem 2rem;
    border-bottom: 1px solid #eee;
  }

  .nav-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    font-weight: 600;
    font-size: 1.25rem;
  }

  .email {
    color: #666;
    text-decoration: none;
    font-size: 0.9375rem;
  }

  .center {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  nav a {
    color: #000;
    text-decoration: none;
    font-size: 0.9375rem;
  }

  .get-started {
    border: 1px solid #000;
    padding: 0.625rem 1.25rem;
    border-radius: 2rem;
    background: #000;
    color: #fff;
    font-size: 0.9375rem;
  }

  .hero {
    padding: 8rem 2rem;
    text-align: center;
    max-width: 1200px;
    margin: 0 auto;
    color: white;
  }

  h1 {
    font-size: 4.5rem;
    line-height: 1.1;
    font-weight: 600;
    margin-bottom: 1.5rem;
    background: linear-gradient(to right, #fff, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 1.5rem;
    color: #a5b4fc;
    margin-bottom: 1rem;
  }

  .offer {
    font-size: 1.25rem;
    color: #e5e7eb;
    margin-bottom: 2.5rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .signup-box {
    display: flex;
    gap: 1rem;
    max-width: 600px;
    margin: 0 auto 1rem;
  }

  .input-wrapper {
    flex: 1;
    position: relative;
  }

  input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 1px solid #eee;
    border-radius: 2rem;
    font-size: 1rem;
  }

  .email-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #666;
  }

  .disclaimer {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 4rem;
  }

  .app-preview {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 300px minmax(400px, 2fr) 200px;
    gap: 2rem;
    padding: 2rem;
    align-items: start;
  }

  .job-card {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid #eee;
    text-align: left;
    height: fit-content;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .bookmark {
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
  }

  .description {
    color: #666;
    font-size: 0.9375rem;
    margin-bottom: 1rem;
  }

  .job-meta {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .company {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .company-logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    overflow: hidden;
  }

  .rating {
    color: #666;
  }

  .interested {
    margin-left: auto;
    background: #e8fff5;
    color: #0d9488;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .phone {
    background: white;
    border-radius: 2rem;
    padding: 1.5rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    height: fit-content;
    max-width: 400px;
    margin: 0 auto;
  }

  .app-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .back {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .filters button {
    background: white;
    border: 1px solid #eee;
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .join-card {
    background: #10b981;
    color: white;
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    height: fit-content;
    position: sticky;
    top: 2rem;
  }

  .star-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .join-card h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
  }

  .join-card p {
    margin: 0;
    font-size: 0.9375rem;
    opacity: 0.9;
  }

  .verification-card {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid #eee;
    margin-bottom: 1rem;
  }

  .screen {
    background: #fafafa;
    border-radius: 1.5rem;
    padding: 1.5rem;
    min-height: 400px;
  }

  @media (max-width: 1200px) {
    .app-preview {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .phone {
      max-width: 100%;
    }

    .join-card {
      position: static;
    }
  }

  @media (max-width: 768px) {
    .center {
      display: none;
    }

    h1 {
      font-size: 3rem;
    }

    .signup-box {
      flex-direction: column;
    }
  }

  .login {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    color: #000;
    padding: 0.625rem 1.25rem;
  }

  .login:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .user-email {
    font-size: 0.9375rem;
    color: #666;
    margin-right: 1rem;
  }

  .auth-form {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .auth-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .auth-button {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #000;
    border-radius: 2rem;
    background: #000;
    color: #fff;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .auth-button.signup {
    background: white;
    color: #000;
  }

  .auth-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .verification-text {
    color: #666;
    font-size: 0.9375rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  h3 {
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .auth-button.secondary {
    background: white;
    color: #000;
  }

  .login-button {
    background: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    border: 1px solid white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-button:hover {
    background: white;
    color: #161616;
  }

  .cta-button {
    background: white;
    color: #161616;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    font-size: 1.125rem;
    transition: all 0.2s;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
</style>
