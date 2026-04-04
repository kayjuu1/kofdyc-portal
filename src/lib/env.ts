// Environment variables on Cloudflare Workers are accessed via bindings,
// not process.env. They are configured as secrets/vars in wrangler.jsonc
// and accessed via `env` from 'cloudflare:workers' in server functions.
//
// No runtime validation is needed here — missing bindings will throw
// at the point of use with a clear error.
