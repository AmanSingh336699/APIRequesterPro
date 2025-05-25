export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiRequest {
  _id?: string;
  collectionId?: string;
  name?: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: { key: string; value: string }[];
  body?: string;
  preScript?: string;
  testScript?: string;
}

export interface Collection {
  _id: string;
  userId: string;
  name: string;
  requests?: ApiRequest[];
}

export interface Environment {
  name: string;
  variables: { key: string; value: string }[];
}

export interface Variable {
  key: string;
  value: string;
}

export interface Environment {
  _id: string;
  name: string;
  variables: Variable[];
}

export interface EnvironmentFormData {
  name: string;
  variables: Variable[];
}
