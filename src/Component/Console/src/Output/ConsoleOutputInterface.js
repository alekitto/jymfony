const OutputInterface = Jymfony.Component.Console.Output.OutputInterface;

/**
 * @memberOf Jymfony.Component.Console.Output
 * @type ConsoleOutputInterface
 *
 * @interface
 */
class ConsoleOutputInterface extends OutputInterface.definition {
    /**
     * Gets the OutputInterface for errors.
     *
     * @returns {Jymfony.Component.Console.Output.OutputInterface}
     */
    get errorOutput() { }

    /**
     * Sets the OutputInterface used for errors.
     *
     * @param {Jymfony.Component.Console.Output.OutputInterface} error
     */
    set errorOutput(error) { }
}

module.exports = getInterface(ConsoleOutputInterface);
