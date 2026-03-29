const fetch = globalThis.fetch;
(async () => {
  try {
    console.log('Testing Mistral API...');
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer nnOvjYfv95n3a02t6xtYZZXcpyA4cuNS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'Say hello in json format {"msg": "hello"}' }],
        response_format: { type: 'json_object' }
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch(e) { console.error('Error:', e.message); }
})();
