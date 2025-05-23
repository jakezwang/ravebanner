// components/MultiSelect.tsx
import CreatableSelect from 'react-select/creatable'
import { GroupBase, MultiValue } from 'react-select'

export interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: (Option | GroupBase<Option>)[]
  selectedOptions: Option[]
  onChange: (selected: Option[]) => void
  placeholder: string
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedOptions,
  onChange,
  placeholder
}) => {
  const handleChange = (newValue: MultiValue<Option>) => {
    onChange([...newValue])
  }

  return (
    <CreatableSelect
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder={placeholder}
      className="text-black"
      classNamePrefix="react-select"
      formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
    />
  )
}

export default MultiSelect
