<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import Toast from '$lib/components/Toast.svelte';
  import { connectMetaMask } from '$lib/metamask';
  import { generateStoryIdeas, reviewStory, generateImage } from '$lib/gaia';
  import { marked } from 'marked';

  let title = '';
  let content = '';
  let storyType = 'smart-contract';
  let saving = false;
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  let user: any = null;
  let metamaskAddress: string | null = null;
  let generating = false;
  let reviewing = false;
  let feedback: string | null = null;
  let previewMode = false;
  let renderedContent = '';
  let generatingImage = false;
  let imagePrompt = '';
  let generatedImages: string[] = [];

  const types = [
    { value: 'smart-contract', label: 'Smart Contract', icon: '⚡' },
    { value: 'ai-model', label: 'AI Model', icon: '🤖' },
    { value: 'defi-protocol', label: 'DeFi Protocol', icon: '💰' }
  ];

  const icons = {
    pen: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
    back: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    ai: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 10 10c0 4.42-2.87 8.17-6.84 9.5-1.08.36-2.16.54-3.16.54-1 0-2.08-.18-3.16-.54C4.87 20.17 2 16.42 2 12 2 6.48 6.48 2 12 2z"/><path d="m15.07 11.25-.9.66c-.36.27-.59.7-.6 1.16l-.03 1.28c-.02.86-.71 1.55-1.57 1.57l-1.28.03c-.47.01-.89.24-1.16.6l-.66.9c-.57.77-1.68.77-2.25 0l-.66-.9c-.27-.36-.7-.59-1.16-.6l-1.28-.03c-.86-.02-1.55-.71-1.57-1.57l-.03-1.28c-.01-.47-.24-.89-.6-1.16l-.9-.66c-.77-.57-.77-1.68 0-2.25l.9-.66c.36-.27.59-.7.6-1.16l.03-1.28c.02-.86.71-1.55 1.57-1.57l1.28-.03c.47-.01.89-.24 1.16-.6l.66-.9c.57-.77 1.68-.77 2.25 0l.66.9c.27.36.7.59 1.16.6l1.28.03c.86.02 1.55.71 1.57 1.57l.03 1.28c.01.47.24.89.6 1.16l.9.66c.77.57.77 1.68 0 2.25z"/></svg>`,
    review: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    spinner: `<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    preview: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    image: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
  };

  const STATUS = {
    DRAFT: 'draft',
    PENDING: 'in_review',
    PUBLISHED: 'published',
    REJECTED: 'rejected'
  } as const;

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast = { message, type };
    setTimeout(() => {
      toast = null;
    }, 3000);
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (!metamaskAddress) {
      try {
        const address = await connectMetaMask();
        metamaskAddress = address;
        // Save to localStorage when connecting
        localStorage.setItem('metamask_address', address);
      } catch (err) {
        showToast('Please connect MetaMask to publish', 'error');
        return;
      }
    }

    saving = true;
    try {
      if (!user) {
        showToast('Please sign in to publish', 'error');
        goto('/login');
        return;
      }

      const { error } = await supabase.from('stories').insert({
        title,
        content,
        story_type: storyType,
        author_id: user.id,
        wallet_address: metamaskAddress,
        status: STATUS.PENDING,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      showToast('Story submitted for review', 'success');
      goto('/dashboard');
    } catch (err) {
      console.error('Failed to publish story:', err);
      showToast('Failed to submit story', 'error');
    } finally {
      saving = false;
    }
  }

  async function handleSaveDraft() {
    if (!title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    saving = true;
    try {
      if (!user) {
        showToast('Please sign in to save', 'error');
        goto('/login');
        return;
      }

      const { error } = await supabase.from('stories').insert({
        title,
        content,
        story_type: storyType,
        author_id: user.id,
        status: STATUS.DRAFT,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      showToast('Draft saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save draft:', err);
      showToast('Failed to save draft', 'error');
    } finally {
      saving = false;
    }
  }

  async function handleGenerateIdeas() {
    if (!storyType) {
      showToast('Please select a story type first', 'error');
      return;
    }

    generating = true;
    try {
      const prompt = `Generate a detailed story idea for a ${storyType} startup or project. 
                     Include technical challenges, innovations, and potential industry impact.
                     If possible, incorporate current trends in ${storyType} technology.`;
      
      const ideas = await generateStoryIdeas(prompt);
      
      // Parse the response to extract title if provided
      const titleMatch = ideas.match(/Title:?\s*([^\n]+)/i);
      if (titleMatch && !title) {
        title = titleMatch[1].trim();
      }
      
      // Update content, preserving any existing content
      if (content) {
        content = content + '\n\n--- AI Generated Ideas ---\n\n' + ideas;
      } else {
        content = ideas;
      }
      
      showToast('Story ideas generated!', 'success');
    } catch (err) {
      console.error('Failed to generate ideas:', err);
      showToast('Failed to generate ideas. Please try again.', 'error');
    } finally {
      generating = false;
    }
  }

  async function handleReviewStory() {
    if (!title.trim() || !content.trim()) {
      showToast('Please fill in title and content first', 'error');
      return;
    }

    reviewing = true;
    try {
      feedback = await reviewStory(title, content, storyType);
      showToast('Review completed!', 'success');
    } catch (err) {
      console.error('Failed to review story:', err);
      showToast('Failed to review story. Please try again.', 'error');
    } finally {
      reviewing = false;
    }
  }

  async function handleGenerateImage() {
    if (!imagePrompt.trim()) {
      showToast('Please enter an image prompt', 'error');
      return;
    }

    generatingImage = true;
    try {
      const imageUrl = await generateImage(imagePrompt);
      generatedImages = [...generatedImages, imageUrl];
      
      // Add image markdown to content
      const imageMarkdown = `\n![Generated Image](${imageUrl})\n`;
      content = content + imageMarkdown;
      
      showToast('Image generated!', 'success');
      imagePrompt = ''; // Clear prompt after successful generation
    } catch (err) {
      console.error('Failed to generate image:', err);
      showToast('Failed to generate image. Please try again.', 'error');
    } finally {
      generatingImage = false;
    }
  }

  // Update markdown preview whenever content changes
  $: {
    try {
      renderedContent = marked(content || '');
    } catch (err) {
      console.error('Failed to parse markdown:', err);
      renderedContent = content;
    }
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showToast('Please sign in to write', 'error');
      goto('/login');
      return;
    }
    user = session.user;

    // Check for saved MetaMask connection
    const savedAddress = localStorage.getItem('metamask_address');
    if (savedAddress) {
      metamaskAddress = savedAddress;
    }
  });
</script>

<div class="write-container">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}
  
  <header class="write-header">
    <div class="header-left">
      <button class="back-button" on:click={() => goto('/dashboard')}>
        {@html icons.back}
        Back
      </button>
      <h1>Write Your Story</h1>
    </div>
    <div class="header-actions">
      <button 
        class="save-button" 
        on:click={handleSaveDraft}
        disabled={saving}
      >
        {@html icons.save}
        Save Draft
      </button>
      <button 
        class="publish-button" 
        on:click={handleSubmit}
        disabled={saving}
      >
        {@html icons.pen}
        {saving ? 'Submitting...' : 'Submit for Review'}
      </button>
      <button 
        class="ai-button" 
        on:click={handleGenerateIdeas}
        disabled={generating}
      >
        {#if generating}
          {@html icons.spinner}
          Generating...
        {:else}
          {@html icons.ai}
          Generate Ideas
        {/if}
      </button>
      <button 
        class="review-button" 
        on:click={handleReviewStory}
        disabled={reviewing}
      >
        {#if reviewing}
          {@html icons.spinner}
          Reviewing...
        {:else}
          {@html icons.review}
          Review Story
        {/if}
      </button>
      <button 
        class="preview-button" 
        on:click={() => previewMode = !previewMode}
        title="Toggle markdown preview"
      >
        {@html icons[previewMode ? 'edit' : 'preview']}
        {previewMode ? 'Edit' : 'Preview'}
      </button>
    </div>
  </header>

  <div class="write-form">
    <div class="form-group">
      <input
        type="text"
        placeholder="Enter your title"
        bind:value={title}
        class="title-input"
      />
    </div>

    <div class="form-group">
      <select bind:value={storyType} class="type-select">
        {#each types as typeOption}
          <option value={typeOption.value}>{typeOption.icon} {typeOption.label}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      {#if previewMode}
        <div class="content-preview markdown-content" >
          {@html renderedContent}
        </div>
      {:else}
        <textarea
          placeholder="Write your story in markdown..."
          bind:value={content}
          class="content-input"
          rows="20"
        ></textarea>
      {/if}
    </div>

    <div class="form-group image-generation">
      <div class="image-input-group">
        <input
          type="text"
          placeholder="Enter image prompt..."
          bind:value={imagePrompt}
          class="image-prompt-input"
        />
        <button 
          class="generate-image-button"
          on:click={handleGenerateImage}
          disabled={generatingImage}
        >
          {#if generatingImage}
            {@html icons.spinner}
            Generating...
          {:else}
            {@html icons.image}
            Generate Image
          {/if}
        </button>
      </div>
      
      {#if generatedImages.length > 0}
        <div class="generated-images">
          {#each generatedImages as imageUrl}
            <div class="image-preview">
              <img src={imageUrl} alt="Generated" />
              <button 
                class="copy-markdown-button"
                on:click={() => {
                  const markdown = `![Generated Image](${imageUrl})`;
                  content = content + '\n' + markdown + '\n';
                  showToast('Image markdown added to content', 'success');
                }}
              >
                {@html icons.copy}
                Copy Markdown
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  {#if feedback}
    <div class="feedback-panel">
      <h3>AI Review Feedback</h3>
      <p>{feedback}</p>
      <button class="close-button" on:click={() => feedback = null}>
        Close
      </button>
    </div>
  {/if}
</div>

<style>
  .write-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 104px 40px 80px;
  }

  .write-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #A5A5A5;
    font-size: 14px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .back-button:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .write-header h1 {
    font-size: 32px;
    font-weight: 600;
    background: linear-gradient(90deg, #FFFFFF 0%, #A5A5A5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 16px;
  }

  .save-button,
  .publish-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-button:hover:not(:disabled),
  .publish-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .publish-button {
    background: #10B981;
    border-color: #10B981;
  }

  .publish-button:hover:not(:disabled) {
    background: #059669;
  }

  .save-button:disabled,
  .publish-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .write-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .title-input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 16px;
    border-radius: 6px;
    font-size: 24px;
    font-weight: 600;
    width: 100%;
  }

  .type-select {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 12px;
    border-radius: 6px;
    font-size: 14px;
    width: 200px;
  }

  .content-input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 16px;
    border-radius: 6px;
    font-size: 16px;
    line-height: 1.6;
    width: 100%;
    resize: vertical;
    min-height: 400px;
    font-family: inherit;
  }

  .title-input:focus,
  .type-select:focus,
  .content-input:focus {
    outline: none;
    border-color: white;
  }

  .type-select option {
    background: #161616;
    color: white;
    padding: 8px;
  }

  .ai-button,
  .review-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(139, 92, 246, 0.1);
    color: rgb(139, 92, 246);
    border: 1px solid rgb(139, 92, 246);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 140px;
    justify-content: center;
  }

  .ai-button:hover:not(:disabled),
  .review-button:hover:not(:disabled) {
    background: rgba(139, 92, 246, 0.2);
    transform: translateY(-1px);
  }

  .ai-button:disabled,
  .review-button:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .feedback-panel {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    background: rgba(32, 32, 32, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    white-space: pre-line;
  }

  .feedback-panel h3 {
    margin: 0 0 12px;
    color: white;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .feedback-panel p {
    margin: 0 0 16px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    line-height: 1.6;
  }

  .close-button {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 768px) {
    .write-container {
      padding: 80px 20px 40px;
    }

    .write-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .header-actions {
      width: 100%;
    }

    .save-button,
    .publish-button {
      flex: 1;
      justify-content: center;
    }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .preview-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .preview-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .content-preview {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 16px;
    border-radius: 6px;
    font-size: 16px;
    line-height: 1.6;
    min-height: 400px;
    overflow-y: auto;
  }

  /* Markdown content styles */
  .markdown-content :global(h1) {
    font-size: 2em;
    margin: 0.67em 0;
    color: white;
  }

  .markdown-content :global(h2) {
    font-size: 1.5em;
    margin: 0.83em 0;
    color: white;
  }

  .markdown-content :global(h3) {
    font-size: 1.17em;
    margin: 1em 0;
    color: white;
  }

  .markdown-content :global(p) {
    margin: 1em 0;
  }

  .markdown-content :global(ul), 
  .markdown-content :global(ol) {
    margin: 1em 0;
    padding-left: 2em;
  }

  .markdown-content :global(li) {
    margin: 0.5em 0;
  }

  .markdown-content :global(code) {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'SF Mono', monospace;
    font-size: 0.9em;
  }

  .markdown-content :global(pre) {
    background: rgba(255, 255, 255, 0.05);
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1em 0;
  }

  .markdown-content :global(pre code) {
    background: none;
    padding: 0;
  }

  .markdown-content :global(blockquote) {
    margin: 1em 0;
    padding-left: 1em;
    border-left: 4px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.7);
  }

  .markdown-content :global(a) {
    color: #8B5CF6;
    text-decoration: none;
  }

  .markdown-content :global(a:hover) {
    text-decoration: underline;
  }

  .markdown-content :global(hr) {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 2em 0;
  }

  .markdown-content :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  .markdown-content :global(th),
  .markdown-content :global(td) {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.5em;
    text-align: left;
  }

  .markdown-content :global(th) {
    background: rgba(255, 255, 255, 0.05);
  }

  .image-generation {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 16px;
  }

  .image-input-group {
    display: flex;
    gap: 8px;
  }

  .image-prompt-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
  }

  .generate-image-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(139, 92, 246, 0.1);
    color: rgb(139, 92, 246);
    border: 1px solid rgb(139, 92, 246);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .generate-image-button:hover:not(:disabled) {
    background: rgba(139, 92, 246, 0.2);
    transform: translateY(-1px);
  }

  .generate-image-button:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .generated-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .image-preview {
    position: relative;
    border-radius: 6px;
    overflow: hidden;
  }

  .image-preview img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 6px;
  }

  .copy-markdown-button {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
  }

  .copy-markdown-button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-1px);
  }
</style> 