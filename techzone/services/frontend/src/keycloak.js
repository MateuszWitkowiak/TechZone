import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:32080",
  realm: "techzone",
  clientId: "techzone-app",
});

export default keycloak;