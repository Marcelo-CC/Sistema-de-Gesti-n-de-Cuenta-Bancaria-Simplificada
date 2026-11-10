import mongoose from 'mongoose';

/**
 * El saldo se almacena como ENTERO en céntimos (saldoCentimos) para evitar
 * errores de redondeo de coma flotante (ej. 0.1 + 0.2 = 0.30000000000000004).
 * La API siempre expone el saldo en unidades monetarias (ej. 150.75).
 */
const cuentaSchema = new mongoose.Schema(
  {
    numeroCuenta: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{4,20}$/, 'El número de cuenta debe contener solo dígitos'],
    },
    titular: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    moneda: { type: String, default: 'PEN', enum: ['PEN', 'USD'] },
    saldoCentimos: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El saldo no puede ser negativo'],
      validate: { validator: Number.isInteger, message: 'saldoCentimos debe ser entero' },
    },
  },
  { timestamps: true }
);

cuentaSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    numeroCuenta: this.numeroCuenta,
    titular: this.titular,
    email: this.email,
    moneda: this.moneda,
    saldo: this.saldoCentimos / 100,
    creadaEn: this.createdAt,
    actualizadaEn: this.updatedAt,
  };
};

export default mongoose.model('Cuenta', cuentaSchema, 'cuentas');
