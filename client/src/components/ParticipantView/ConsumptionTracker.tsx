import { useState } from 'react'
import { api, ConsumptionItemDto, ParticipantResponse } from '../../services/api'
import AddItemForm from './AddItemForm'
import ItemList from './ItemList'

interface ConsumptionTrackerProps {
  participant: ParticipantResponse
  token: string
  onUpdate: (updated: ParticipantResponse) => void
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default function ConsumptionTracker({ participant, token, onUpdate }: ConsumptionTrackerProps) {
  const [editItem, setEditItem] = useState<ConsumptionItemDto | null>(null)

  const participantNames: Record<string, string> = {
    [participant.id]: `${participant.name} (tú)`,
    ...Object.fromEntries(participant.otherParticipants.map(p => [p.id, p.name]))
  }

  const handleAdd = async (data: Parameters<typeof api.addItem>[1]) => {
    const updated = await api.addItem(token, data)
    onUpdate(updated)
  }

  const handleUpdate = async (data: Parameters<typeof api.addItem>[1]) => {
    if (!editItem) return
    const updated = await api.updateItem(token, editItem.id, data)
    onUpdate(updated)
    setEditItem(null)
  }

  const handleDelete = async (itemId: string) => {
    const updated = await api.deleteItem(token, itemId)
    onUpdate(updated)
  }

  const myTotal = participant.items.reduce((s, i) => s + i.lineTotal, 0)

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-900">Tu consumo</h3>
          <span className="text-green-700 font-bold">{formatCLP(myTotal)}</span>
        </div>

        <ItemList
          items={participant.items}
          onEdit={setEditItem}
          onDelete={handleDelete}
          participantNames={participantNames}
        />
      </div>

      {editItem ? (
        <AddItemForm
          myId={participant.id}
          otherParticipants={participant.otherParticipants}
          editItem={editItem}
          onSubmit={handleUpdate}
          onCancel={() => setEditItem(null)}
        />
      ) : (
        <AddItemForm
          myId={participant.id}
          otherParticipants={participant.otherParticipants}
          onSubmit={handleAdd}
        />
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
        <p className="text-sm text-yellow-700">
          ⏳ El organizador cerrará el registro cuando terminen de pedir.
          Una vez cerrado, verás tu monto final para transferir.
        </p>
      </div>
    </div>
  )
}
