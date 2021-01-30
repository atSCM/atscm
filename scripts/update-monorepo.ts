import { relative } from 'path';
import findPackages, { Project } from '@pnpm/find-workspace-packages';
import TemplateFile from '@ls-age/update-section';
import rootManifest from '../package.json';

type PackageInfo = Project & {
  manifest: { repository: { directory: string } };
  dir: string;
  relative: string;
};

/* eslint-disable no-param-reassign */
function updatePackage(project: PackageInfo): PackageInfo {
  const base = new URL(rootManifest.homepage);
  base.pathname += '/';
  project.manifest.bugs = rootManifest.bugs;
  project.manifest.homepage = new URL(`tree/master/${project.relative}#readme`, base).toString();

  project.manifest.repository = {
    ...rootManifest.repository,
    directory: project.relative,
  };
  project.writeProjectManifest(project.manifest);

  return project;
}
/* eslint-enable no-param-reassign */

async function updateReadme() {
  const cwd = process.cwd();
  const packages: PackageInfo[] = [];

  for (const project of await findPackages(cwd)) {
    if (project.dir !== cwd) {
      packages.push(
        updatePackage({
          ...project,
          relative: relative(cwd, project.dir),
        } as PackageInfo)
      );
    }
  }

  const readme = new TemplateFile('./README.md', {
    notice: 'This section is generated. Run `npm run update-monorepo` to update it.',
  });
  await readme.updateSection(
    'overview',
    (await TemplateFile.getSection('./packages/atscm/README.md', 'overview')).replace(
      /^##/gm,
      '###'
    )
  );

  await readme.updateSection(
    'packages',
    packages
      .map(
        ({ manifest: p, relative: dir }) =>
          `- [${p.name}](./${dir}) ${p.description}

  > ![npm](https://img.shields.io/npm/v/${p.name}?logo=npm)
  >
  > [GitHub](${p.homepage}) · [npm](https://www.npmjs.com/package/${p.name})`
      )
      .join('\n\n')
  );
  await readme.save();
}

updateReadme().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
