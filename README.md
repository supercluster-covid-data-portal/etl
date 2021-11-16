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

   For convenience, there is a script `dev` that will build then run all. Use `npm run dev` to build and run all stages.

### Run Specific Stages

Each stage of the ETL has its own script to run ONLY that stage. Make sure you build the code before running.

| Stage     | NPM Script          | CLI Option  | Description                                                                                                            |
| --------- | ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Extract   | `npm run extract`   | --extract   | Will fetch all data from the DNA Stack data table APIs. This data is stored in mongo for manipulation in the next step |
| Transform | `npm run transform` | --transform | Compiles all data fetched during the extract stage into sequence-centric documents and stores these in mongo.          |
| Load      | `npm run load`      | --load      | Creates a new ElasticSearch index and inserts each of the sequence-centric documents created in the Transform stage.   |

> **Warning**  
> Each stage is destructive, it will remove then replace all previously extracted or transformed data stored in mongo.

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
