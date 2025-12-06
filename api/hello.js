export default function handler(request) {
  // This is your backend code
  const data = {
    message: "Hello from your Vercel backend 👋",
    time: new Date().toISOString(),
  };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
