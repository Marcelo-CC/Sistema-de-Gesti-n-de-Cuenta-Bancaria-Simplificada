import mongoose from 'mongoose';

const transaccionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA'],
    },
    // Monto en céntimos (entero positivo)
    montoCentimos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    // Depósito: solo destino. Retiro: solo origen. Transferencia: ambos.
    cuentaOrigen: { type: String, default: null },
    cuentaDestino: { type: String, default: null },
    descripcion: { type: String, trim: true, maxlength: 140, default: '' },
    // Saldos resultantes tras la operación (auditoría)
    saldoOrigenDespuesCentimos: { type: Number, default: null },
    saldoDestinoDespuesCentimos: { type: Number, default: null },
    fecha: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

transaccionSchema.index({ cuentaOrigen: 1, fecha: -1 });
transaccionSchema.index({ cuentaDestino: 1, fecha: -1 });

const aUnidades = (c) => (c === null || c === undefined ? null : c / 100);

transaccionSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    tipo: this.tipo,
    monto: aUnidades(this.montoCentimos),
    cuentaOrigen: this.cuentaOrigen,
    cuentaDestino: this.cuentaDestino,
    descripcion: this.descripcion,
    saldoOrigenDespues: aUnidades(this.saldoOrigenDespuesCentimos),
    saldoDestinoDespues: aUnidades(this.saldoDestinoDespuesCentimos),
    fecha: this.fecha,
  };
};

export default mongoose.model('Transaccion', transaccionSchema, 'transacciones');
