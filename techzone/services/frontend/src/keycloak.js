import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "techzone",
  clientId: "techzone-app",
});

export default keycloak;