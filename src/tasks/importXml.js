import ImportXmlStream from '../lib/gulp/ImportXmlStream';
import { src } from 'gulp';
import ProjectConfig from '../config/ProjectConfig';

/**
 * Imports all xml files needed for atscm usage.
 */
export default function importXml() {
  const srcStream = src(ProjectConfig.RelativeXmlResourcesPath);

  return srcStream
    .pipe(new ImportXmlStream());
}

importXml.description = 'Imports all xml resources needed for atscm usage';
