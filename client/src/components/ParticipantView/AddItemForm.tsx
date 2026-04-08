import { useState } from 'react'
import { AddItemRequest, ConsumptionItemDto, OtherParticipantDto } from '../../services/api'

interface AddItemFormProps {
  myId: string
  otherParticipants: OtherParticipantDto[]
  editItem?: ConsumptionItemDto | null
  onSubmit: (data: AddItemRequest) => Promise<void>
  onCancel?: () => void
}

export default function AddItemForm({ myId, otherParticipants, editItem, onSubmit, onCancel }: AddItemFormProps) {
  const [description, setDescription] = useState(editItem?.description ?? '')
  const [unitPrice, setUnitPrice] = useState(editItem?.unitPrice.toString() ?? '')
  const [quantity, setQuantity] = useState(editItem?.quantity.toString() ?? '1')
  const [isShared, setIsShared] = useState(editItem?.isShared ?? false)
  const [sharedWith, setSharedWith] = useState<string[]>(
    editItem?.sharedWithParticipantIds?.filter(id => id !== myId) ?? []
  )
  const [loading, setLoading] = useState(false)

  const toggleShared = (participantId: string) => {
    setSharedWith(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  const handleSubmit = async () => {
    if (!description.trim() || !unitPrice) return
    setLoading(true)
    try {
      await onSubmit({
        description: description.trim(),
        unitPrice: Number(unitPrice),
        quantity: Number(quantity) || 1,
        isShared,
        sharedWithParticipantIds: isShared ? [myId, ...sharedWith] : undefined,
      })
      if (!editItem) {
        setDescription('')
        setUnitPrice('')
        setQuantity('1')
        setIsShared(false)
        setSharedWith([])
      }
    } finally {
      setLoading(false)
    }
  }

  const valid = description.trim() && Number(unitPrice) > 0

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <h4 className="font-medium text-blue-900">
        {editItem ? '✏️ Editar item' : '+ Agregar lo que pediste'}
      </h4>

      <div>
        <label className="label">Descripción *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Cerveza Kunstmann, Pizza Pepperoni..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Precio unitario *</label>
          <input
            type="number"
            className="input-field"
            placeholder="3500"
            min="1"
            value={unitPrice}
            onChange={e => setUnitPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Cantidad</label>
          <input
            type="number"
            className="input-field"
            placeholder="1"
            min="1"
            max="100"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        </div>
      </div>

      {otherParticipants.length > 0 && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isShared}
              onChange={e => setIsShared(e.target.checked)}
              className="text-green-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              ¿Compartiste esto con otros?
            </span>
          </label>

          {isShared && (
            <div className="mt-2 space-y-1 pl-6">
              <p className="text-xs text-gray-500">Selecciona con quién compartiste (tú siempre incluido):</p>
              {otherParticipants.map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharedWith.includes(p.id)}
                    onChange={() => toggleShared(p.id)}
                    className="text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{p.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary flex-1 py-2 text-sm">
            Cancelar
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!valid || loading}
          className="btn-primary flex-1 py-2 text-sm"
        >
          {loading ? 'Guardando...' : editItem ? 'Guardar cambios' : '+ Agregar'}
        </button>
      </div>
    </div>
  )
}
