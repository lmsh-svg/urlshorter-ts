document.getElementById('shorten-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const longUrl = document.getElementById('long-url').value;
  const extension = document.getElementById('extension').value;
  const resultEl = document.getElementById('result');
  const errorEl = document.getElementById('error');

  errorEl.textContent = '';
  resultEl.textContent = '';

  try {
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl, extension }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Something went wrong');
    }

    const { shortUrl } = await res.json();
    resultEl.innerHTML = `Short URL: <a href="${shortUrl}">${shortUrl}</a>`;
  } catch (err) {
    errorEl.textContent = err.message;
  }
});