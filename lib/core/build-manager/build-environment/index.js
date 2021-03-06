'use strict';

const nfile = require('nami-utils').file;

const CompilationEnvVarsHandler = require('./compilation-env-handler');
const _ = require('nami-utils/lodash-extra');
const Platform = require('./platform');

/**
 * Class representing Build Environment Manager
 * @namespace Blacksmith.BuildEnvironment
 * @class
 * @param {Object} [options] - Object overriding default configuration
 * @param {Object} [options.outputDir] - Directory to store the output
 * @param {Object} [options.prefixDir] - Build prefix
 * @param {Object} [options.sandbox] - Build directory
 * @param {Object} [options.artifactsDir] - Artifacts directory
 * @param {Object} [options.logsDir] - Logs directory
 * @param {Object} [options.platform] - Platform of the build
 */
class BuildEnvironment {
  constructor(options) {
    const defaultOptions = {
      platform: null,
      outputDir: null,
      prefixDir: null,
      maxParallelJobs: Infinity,
      sandboxDir: null,
      artifactsDir: null,
      logsDir: null
    };
    options = options || {};
    _.each(defaultOptions, (defaultValue, key) => {
      this[key] = _.isEmpty(options[key]) ? defaultValue : options[key];
    });

    if (!this.logsDir) this.logsDir = nfile.join(this.outputDir, 'logs');

    if (_.isString(options.platform)) {
      throw new Error(`You should provide the required platform as an Object not a string: ${options.platform}`);
    }
    this.platform = new Platform(options.platform);
    if (!this.platform) {
      throw new Error('You need to provide a platform to build for');
    }

    _.each(['outputDir', 'prefixDir', 'sandboxDir', 'artifactsDir', 'logsDir'], d => {
      if (!_.isEmpty(this[d])) {
        nfile.mkdir(this[d]);
      }
    });

    this.target = {
      platform: this.platform,
      isUnix: !this.platform.os.match(/windows/)
    };

    this._envVarHandler = this._getNewEnvVarsHandler(this.platform);
  }

  /**
   * Add new a new environment variable or combine it if already exists
   * @function Blacksmith.BuildEnvironment.CompilationEnvVarsHandler~addEnvVariable
   * @param {string} name - Environment variable name
   * @param {string} value - Environment variable value
   * @param {Object} [options]
   * @param {string} [options.operation='merge'] - Operation in case the variable already exists. Posible values:
   * auto, merge, append, prepend and replace
   */
  addEnvVariable(name, value, options) {
    this._envVarHandler.addEnvVariable(name, value, options);
  }
  /**
   * Add new environment variables
   * @function Blacksmith.BuildEnvironment~addEnvVariables
   * @param {Object} vars - Key/value with the variables to add
   * @param {Object} [options]
   * @param {string} [options.operation='merge'] - Operation in case the variable already exists. Posible values:
   * merge, append, prepend and replace
   */
  addEnvVariables(vars, options) {
    this._envVarHandler.addEnvVariables(vars, options);
  }
  /**
   * Get current environment variables
   * @function Blacksmith.BuildEnvironment.CompilationEnvVarsHandler~getEnvVariables
   * @param {Object} extraVars - Additional variables to add
   * @param {string} [options.stringify=true] - Stringify the result
   */
  getEnvVariables(extraVars, options) {
    return this._envVarHandler.getEnvVariables(extraVars, options);
  }
  /**
   * Reset environment variables to its default value
   * @function Blacksmith.BuildEnvironment~resetEnvVariables
   */
  resetEnvVariables() {
    this._envVarHandler = this._getNewEnvVarsHandler(this.target.platform);
  }

  _getNewEnvVarsHandler(platform) {
    return new CompilationEnvVarsHandler({platform: platform});
  }

}

module.exports = BuildEnvironment;
