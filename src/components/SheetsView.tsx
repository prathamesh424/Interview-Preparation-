import { useState } from 'react';
import QuestionSheetList from './QuestionSheetList';
import SheetDetailView from './SheetDetailView';

const SheetsView = () => {
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>("");

  const handleSheetSelect = (sheetId: string, sheetName: string) => {
    setSelectedSheetId(sheetId);
    setSelectedSheetName(sheetName);
  };

  const handleBackToList = () => {
    setSelectedSheetId(null);
    setSelectedSheetName("");
  };

  return (
    <div className="sheets-view">
      {selectedSheetId ? (
        <SheetDetailView
          sheetId={selectedSheetId}
          sheetName={selectedSheetName}
          onBack={handleBackToList}
        />
      ) : (
        <QuestionSheetList onSheetSelect={handleSheetSelect} />
      )}
    </div>
  );
};

export default SheetsView;
