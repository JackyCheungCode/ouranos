export default {
  async fetch() {
    return new Response("ouranos Worker is ready.", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};