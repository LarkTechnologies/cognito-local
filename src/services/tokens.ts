import jwt from "jsonwebtoken";
import * as uuid from "uuid";
import PrivateKey from "../keys/cognitoLocal.private.json";
import { User } from "./userPoolClient";

const REFRESH_TOKEN_SECRET = "super-secret-refresh";
export const refreshTokens: any = {};

export interface Token {
  client_id: string;
  iss: string;
  sub: string;
  token_use: string;
  username: string;
  event_id: string;
  scope: string;
  auth_time: Date;
  jti: string;
}

function generateRefreshToken(user: User): string {
  const username = user.Username;
  const refreshToken = jwt.sign({ user: { username } }, REFRESH_TOKEN_SECRET);
  refreshTokens[username] = refreshToken;
  return refreshToken;
}

function generateIdToken(
  user: User,
  authTime: number,
  userPoolId: string,
  clientId: string,
  eventId: string
) {
  const attributes: any = {};
  user.Attributes.forEach((attribute) => {
    const { Value } = attribute;
    let { Name } = attribute;
    if (
      Name.toLowerCase().startsWith("custom") &&
      Name.split(":").length === 2
    ) {
      Name = Name.split(":")[1];
    }
    attributes[Name] = Value;
  });

  return jwt.sign(
    {
      sub: user.Username,
      email_verified: true,
      event_id: eventId,
      token_use: "id",
      auth_time: authTime,
      "cognito:username": user.Username,
      ...attributes,
    },
    PrivateKey.pem,
    {
      algorithm: "RS256",
      // TODO: this needs to match the actual host/port we started the server on
      issuer: `http://localhost:9229/${userPoolId}`,
      expiresIn: "24h",
      audience: clientId,
      keyid: "CognitoLocal",
    }
  );
}

export function generateTokens(
  user: User,
  clientId: string,
  userPoolId: string
) {
  const eventId = uuid.v4();
  const authTime = new Date().getTime();

  return {
    AccessToken: jwt.sign(
      {
        sub: user.Username,
        event_id: eventId,
        token_use: "access",
        scope: "aws.cognito.signin.user.admin", // TODO: scopes
        auth_time: authTime,
        jti: uuid.v4(),
        client_id: clientId,
        username: user.Username,
      },
      PrivateKey.pem,
      {
        algorithm: "RS256",
        issuer: `http://localhost:9229/${userPoolId}`,
        expiresIn: "24h",
        keyid: "CognitoLocal",
      }
    ),
    IdToken: generateIdToken(user, authTime, userPoolId, clientId, eventId),
    RefreshToken: generateRefreshToken(user),
  };
}
