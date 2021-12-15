# ETL

The Supercluster Covid ETL is a NodeJS runnable program that:

- **Extract**: collects the available DNAStack host data
- **Transform**: converts this data into de-normalized sequence-centric documents
- **Load**: Uploads this data to a new ElasticSearch index

The application is written in TypeScript and gets built into a CLI.

Each stage of the ETL can be run independently or in sequence through command line arguments, or through the npm scripts `extract`, `transform`, and `load` which are made available through the npm `package.json`.

The application is also built into a Docker image available on ghcr.io (link to be added here once available).

## Developer Quick Start

Follow these steps to run the ETL in your local development environment, using docker for dependencies to run the ETL.

1. Create `.env` file:

   Copy the contents of `.env.example` to a new file named `.env` at the route of thise project. You can change any environment variables there as needed for your setup. The defaults provided will connect you to the DNAStack staging data api and the local dockerized services.

1. Install NPM dependencies:

   ```bash
   npm ci
   ```

1. Start docker services:

   Dockerized dependencies are provided through docker-compose, defined in `/docker-compose`. For convenience, a `Makefile` is provided with commands to start and stop these services:

   Start all docker services:

   ```bash
   make docker-start
   ```

   Stop all docker services:

   ```bash
   make docker-stop
   ```

1. Build and Run

   Build:

   ```bash
   npm run build
   ```

   Run all stages:

   ```bash
   npm run all
   ```

1. Optional for dev:
   For convenience, there is a script `dev` that will build then run the application as an express server with the ETL scheduled as a cronjob.

   ```bash
   npm run dev
   ```

### Run Options

Each stage of the ETL has its own script to run ONLY that stage. Make sure you build the code before running.

The application can also run as an express server with an API for initiating the ETL (all stages, or individual stages).

The applicaiton can also run with the ETL scheduled as a cronjob.

| Stage     | NPM Script          | CLI Option  | Description                                                                                                                                                                |
| --------- | ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extract   | `npm run extract`   | --extract   | Will fetch all data from the DNA Stack data table APIs. This data is stored in mongo for manipulation in the next step                                                     |
| Transform | `npm run transform` | --transform | Compiles all data fetched during the extract stage into sequence-centric documents and stores these in mongo.                                                              |
| Load      | `npm run load`      | --load      | Creates a new ElasticSearch index and inserts each of the sequence-centric documents created in the Transform stage.                                                       |
| All       | `npm run all`       | --all       | Runs all 3 stages in a single run.                                                                                                                                         |
|           |                     |             |                                                                                                                                                                            |
| Cron      | `npm run cron`      | --cron      | Runs as long lived application that will trigger the ETL (all stages) on a cronjob type schedule. The schedule is configured in the env and defaults to daily at midnight. |
| Server    | `npm run server`    | --server    | Runs express server with api for running the ETL or interacting with the cronjob (if enabled).                                                                             |

> **Warning**  
> The extract and transform stages are destructive, they will remove then replace all previously extracted or transformed data stored in mongo.
> The load stage will craete a new, versioned index and swap this index into the search alias. The number of old indices to keep is configurable in Rollcall.

## CLI Arguments

> **Transform Stage Memory Requirements**  
> In order to successfully process the full data set, the amount of RAM available to Node will need to be increased from default for the `transform` stage. It runs without issue with **4Gb RAM**. This is configured in the npm scripts, but when run via command line make sure that the argument `--max-old-space-size=4096` is provided.

Building this project produces a Node runnable script in the `/dist` folder. You can run this script directly instead of through the npm scripts via node.

To run all stages via command line:

```bash
node --max-old-space-size=4096 dist --all
```

A help command is available to see all arguments available:

```bash
node dist --help
```

Most relevant are the commands to select which stages to run. If no stage argument (or --all) is provided then the application will perform no work.

> **NOTE**  
> You can perform any combination of the stages in a single run of the application, except it will not run the specific combination of only **extract** and **load** (while skipping **transform**). This is because running **load** will use whatever data is in the mongo sequence-centric collection, which in this case would be data from a previous run, not from the **extract** just performed. There is no technical limitation demanding this, it is simply there to prevent accidentally loading different data than you have just extracted.

## Server Routes

No Swagger is provided, but the following API endpoints are available when the application is run with the `--server` option.

### Cron Job Status

Details about the cronjob scheduled ETL.

`GET /jobs` - Summary of cron job status. This includes when the job will next run, the cronjob schedule from config, and if the cronjob is enabled to run or not. If the status reports `init: false` that means the cronjob version of the ETL is not initialized, likely because the service was run without the `--cron` option.

`POST /jobs/deactivate` - Deactive the ETL cronjob. When deactivate, it will not be run on the schedule.
`POST /jobs/activate` - Reactives the ETL cronjob. When activate, it will be run on the schedule.

### ETL

API to start the ETL immediately. All stages can be run, or each stage can be called individually:

`POST /etl/all` - Run all stages.

`POST /etl/extract` - Run only the extract stage.
`POST /etl/transform` - Run only the transform stage.
`POST /etl/load` - Run only the load stage.
