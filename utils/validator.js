
import Joi from "joi";
const validator = (schema) => (payload) => schema.validate(payload,{abortEarly : false});
const fromSchema = Joi.object({
    userName:Joi.string().min(3).required(),
    userMobile: Joi.string().regex(/^[0-9]{10}$/).messages({'string.pattern.base': `Phone number must have 10 digits.`}).required(),
    userEmail: Joi.string().email().required(),
    userAge: Joi.number().required(),
    userAddress: Joi.string().required(),
    userAadhar: Joi.number().required(),
    userMonthlyIncome: Joi.number().required(),
    userElectricityBill : Joi.number().required(),
    receivedAssistance : Joi.boolean().required(),
    residenceType : Joi.string().required(),
    assistanceType: Joi.string().required(),
    referredBy : Joi.string().required()
});

export default  validator(fromSchema);

