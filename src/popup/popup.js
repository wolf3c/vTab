import ArchivedManager from '../archived_manager/ArchivedManager.svelte';

const app = new ArchivedManager({
  target: document.getElementById('popup')
});

export default app;