import execa from 'execa';

export default async function runBin(args = process.argv.slice(2)) {
  process.env.CREATE_ATSCM = '1';
  await execa('npx', ['atscm-cli', 'init', ...args], { stdio: 'inherit' });
}

if (require.main === module) {
  runBin().catch((error) => {
    console.error(error.message);
    process.exitCode = process.exitCode || 1;
  });
}
