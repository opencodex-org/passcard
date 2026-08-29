export const deploymentConfig = {
  production: {
    frontend: {
      domain: "www.passcard.com",
      protocol: "https",
    },

    backend: {
      domain: "api.passcard.com",
      protocol: "https",
    },

    environment: "production",

    security: {
      https: true,
      secureCookies: true,
    },
  },
};
