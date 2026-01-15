import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

export default function PostponePopover({ onConfirm }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")

  const today = new Date().toISOString().split("T")[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Postpone"
        >
          <Clock className="h-4 w-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-56 space-y-3" align="start">
        <div className="text-sm font-medium text-gray-700">
          Postpone to date
        </div>

        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        />

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDate("")
              setOpen(false)
            }}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            disabled={!date}
            onClick={async () => {
              await onConfirm(date)
              setDate("")
              setOpen(false)
            }}
          >
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
