import React from 'react'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon } from '@radix-ui/react-icons'

interface SelectProps {
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const RadixSelect: React.FC<SelectProps> = ({ options, onChange, placeholder, className }) => {
  return (
    <Select.Root onValueChange={onChange}>
      <Select.Trigger 
        className={`inline-flex items-center justify-between rounded px-4 py-2 text-sm font-medium bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full ${className}`}
        style={{ backgroundColor: '#4a5568', color: 'white' }}
      >
        <Select.Value placeholder={placeholder || "Select an option"} />
        <Select.Icon>
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content 
          className="overflow-hidden rounded-md shadow-lg"
          style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
          position="popper"
          sideOffset={5}
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex items-center px-8 py-2 text-sm rounded-sm cursor-default select-none outline-none"
                style={{ color: 'black', backgroundColor: 'white' }}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}