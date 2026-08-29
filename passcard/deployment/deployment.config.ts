export const deploymentConfig = {
  production: {
    domain: "passcard.eu.org",

    frontend: {
      url: "https://passcard.eu.org",
    },

    backend: {
      url: "https://api.passcard.eu.org",
    },

    environment: "production",

    security: {
      https: true,
      secureCookies: true,
    },
  },
};
