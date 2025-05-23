// components/MultiSelect.tsx
import Select, { MultiValue } from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedOptions: Option[];
  onChange: (selected: Option[]) => void;
  placeholder: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedOptions, onChange, placeholder }) => {
  const handleChange = (newValue: MultiValue<Option>) => {
    onChange([...newValue]) // convert readonly to mutable array
  }

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder={placeholder}
      className="text-black"
    />
  );
};

export default MultiSelect;
