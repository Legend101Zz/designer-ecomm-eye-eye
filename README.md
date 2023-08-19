## Getting started

Install `Docker` and `Docker Compose` which are used to maximise the convenience of development on local machine.

When both are installed, build the backend image as follow:

```sh
docker-compose build
```

Run the app:

```sh
docker-compose up
```

Go to:

```
 http://localhost:8080/api/health
```

If you see the following response in the browser:

```
{"status":"OK","data":"2022-02-13T20:05:13.965Z"}
```

It means that everything work as expected.

## Getting started, standard way (no containerization)

If you want to run Backend "standard way" using the `npm` instead of `docker-compose`.
Note: you need to set env variables defined in `.env.local` file.
On mac OS you can use `export $(cat .env.local)` to export all env variables from the .env.local file.

Install dependencies:

```
npm install
```

Run server in dev mode:

```
npm run server:dev
```

## How to work with the AR-Backend

There are few rules that you have to obey .

1. Enviromment variables - define your envs in `.env.local` file and provide validation rules for them inside `@config/config.ts` file.
2. Structure your solution by components.
3. Define your routung inside `api.ts` fiile.
4. Describe your newly created API inside `swagger.json` file

## Testing

The Jest test suites are run by executing

```sh
npm test
```

To run tests directly inside of the Backend container:

```sh
docker-compose run web npm run test
```

## Code linting

Run code quality analysis using

```sh
npm run lint
```

or insde of the container

```sh
docker-compose run web npm run lint
```

## Fixing problems

Automatically fix linter's problems

```sh
npm run lint:fix
```

or insde of the container

```sh
docker-compose run web npm run lint:fix
```
