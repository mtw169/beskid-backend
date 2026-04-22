import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { Experiment, Model, Template } from '../model/model';
import * as rawModels from './models.json';
import * as rawFDS from './fds.json';
import * as rawExperiments from './experiments.json';
import * as rawScales from './scales.json';
import { ApiProperty } from '@nestjs/swagger';

export class Info {
  @ApiProperty({
    type: String,
    description: 'GitHub commit ID of current version',
  })
  commit: string;

  @ApiProperty({
    type: String,
    description: 'GitHub branch of current version',
  })
  branch: string;
}

// file settings
export const expirationFile = '.expiration';
export const encoding = 'utf8';
export const extension = '.json';

// directories
export const dataDirectory = resolve('data');
export const trainingDirectory = resolve('training');
export const templateDirectory = resolve('templates');

// generate models
export const models: Model[] = rawModels.map((model) => {
  const experiments: Experiment[] = model.experiments.map((experiment) => ({
    id: experiment.id,
    ...rawExperiments[experiment.id],
    scale: rawScales[rawExperiments[experiment.id].scale],
    conditions: experiment.conditions,
  }));

  const hasTemplateCondition = (experimentId: string, condition: number) =>
    !!experiments.find(
      (experiment) => experiment.id === experimentId && !!experiment.conditions.find((conditionConfig) => conditionConfig.values.includes(condition))
    );

  return new Model({
    id: model.id,
    description: model.description,
    name: model.name,
    resolution: model.resolution,
    fds: {
      version: model.fds,
      revision: rawFDS[model.fds],
    },
    experiments,
    templates: model.templates
      .map(
        (template) =>
          new Template({
            templatePath: join(templateDirectory, template.file),
            experimentId: template.experimentId,
            condition: template.experimentCondition,
          })
      )
      .filter((template) => existsSync(template.templatePath) && hasTemplateCondition(template.experimentId, template.condition)),
    disabled: model.disabled,
  });
});
