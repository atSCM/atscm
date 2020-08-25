import parseOptions from 'mri';

interface ExportOptions {
  nodes: string | string[];
  outFile: string;
}

function isOptions(optionsOrDone: unknown): optionsOrDone is ExportOptions {
  return typeof optionsOrDone === 'object';
}

function getCommandLineOptions() {
  return parseOptions(process.argv.slice(2), {
    alias: {
      outFile: ['out-file', 'o'],
      nodes: ['node', 'n'],
    },
  });
}

export default async function exportTask(optionsOrDone: Partial<ExportOptions> = {}) {
  const { nodes: rawNodes, ...options } = isOptions(optionsOrDone)
    ? optionsOrDone
    : getCommandLineOptions();

  if (!rawNodes) {
    throw new Error("Missing 'nodes' option");
  }
  const nodes = Array.isArray(rawNodes) ? rawNodes : [rawNodes];

  console.info('Running with nodes', { nodes, options });
}

exportTask.description = 'Export nodes from atvise server';
