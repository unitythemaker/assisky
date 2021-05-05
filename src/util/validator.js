const Validator = require("fastest-validator");
const v = new Validator();

const configSchema = {
    voskLogLevel: { type: "number", integer: true, min: -1 },
    modelPath: { type: "string", min: 1, max: 255, optional: true },
};

exports.isConfigValid = v.compile(configSchema);
