import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: process.env.KEYCLOAK_REALM_URL + '/protocol/openid-connect/certs'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      console.error("Błąd pobierania klucza JWKS:", err);
      return callback(err, null);
    }
    if (!key) {
      console.error("Nie znaleziono klucza dla kid:", header.kid);
      client.getKeys(function(e, keys) {
        console.error("Dostępne klucze:", JSON.stringify(keys, null, 2));
        return callback(new Error("Brak klucza publicznego"), null);
      });
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    if (!signingKey) {
      console.error("Brak klucza publicznego w obiekcie key:", key);
      return callback(new Error("Brak klucza publicznego"), null);
    }
    callback(null, signingKey);
  });
}

const checkJwt = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);
  const token = auth.split(" ")[1];

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      console.error("Błąd weryfikacji JWT:", err);
      return res.sendStatus(401);
    }
    req.user = decoded;
    next();
  });
};

export default checkJwt;