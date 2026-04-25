import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download } from 'lucide-react';

interface ClaimData {
  claimNumber?: string;
  claimantName: string;
  claimantPhone: string;
  claimType: 'collision' | 'liability' | 'comprehensive' | 'medical' | 'other';
  accidentDate: string;
  accidentTime: string;
  accidentLocation: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  };
  damageDescription: string;
  injuries: string;
  policeReportNumber?: string;
  witnesses: Array<{
    name: string;
    phone: string;
  }>;
  insuranceNotes: string;
  status: 'open' | 'under-review' | 'settled' | 'denied';
}

interface ClaimsFormProps {
  onClose?: () => void;
  onSave?: (claimData: ClaimData) => void;
  initialData?: Partial<ClaimData>;
}

const ClaimsForm: React.FC<ClaimsFormProps> = ({ onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<ClaimData>({
    claimantName: initialData?.claimantName || '',
    claimantPhone: initialData?.claimantPhone || '',
    claimType: initialData?.claimType || 'collision',
    accidentDate: initialData?.accidentDate || new Date().toISOString().split('T')[0],
    accidentTime: initialData?.accidentTime || '',
    accidentLocation: initialData?.accidentLocation || '',
    vehicleInfo: {
      make: initialData?.vehicleInfo?.make || '',
      model: initialData?.vehicleInfo?.model || '',
      year: initialData?.vehicleInfo?.year || '',
      licensePlate: initialData?.vehicleInfo?.licensePlate || '',
    },
    damageDescription: initialData?.damageDescription || '',
    injuries: initialData?.injuries || 'None reported',
    policeReportNumber: initialData?.policeReportNumber || '',
    witnesses: initialData?.witnesses || [],
    insuranceNotes: initialData?.insuranceNotes || '',
    status: initialData?.status || 'open',
  });

  const [newWitness, setNewWitness] = useState({ name: '', phone: '' });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVehicleInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleInfo: {
        ...prev.vehicleInfo,
        [field]: value
      }
    }));
  };

  const addWitness = () => {
    if (newWitness.name && newWitness.phone) {
      setFormData(prev => ({
        ...prev,
        witnesses: [...prev.witnesses, newWitness]
      }));
      setNewWitness({ name: '', phone: '' });
    }
  };

  const removeWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave?.(formData);
  };

  const handleDownload = () => {
    const claimSummary = `
AUTO INSURANCE CLAIM FORM
========================

CLAIM INFORMATION
-----------------
Claimant Name: ${formData.claimantName}
Claimant Phone: ${formData.claimantPhone}
Claim Type: ${formData.claimType}
Status: ${formData.status}

ACCIDENT DETAILS
----------------
Date: ${formData.accidentDate}
Time: ${formData.accidentTime}
Location: ${formData.accidentLocation}
Police Report #: ${formData.policeReportNumber || 'N/A'}

VEHICLE INFORMATION
-------------------
Make/Model: ${formData.vehicleInfo.year} ${formData.vehicleInfo.make} ${formData.vehicleInfo.model}
License Plate: ${formData.vehicleInfo.licensePlate}

DAMAGE & INJURIES
-----------------
Damage Description:
${formData.damageDescription}

Injuries:
${formData.injuries}

WITNESSES (${formData.witnesses.length})
---------
${formData.witnesses.map((w, i) => `${i + 1}. ${w.name} - ${w.phone}`).join('\n')}

ADJUSTER NOTES
--------------
${formData.insuranceNotes}

Generated: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([claimSummary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claim-${formData.claimantName
      .toLowerCase()
      .replace(/\s+/g, '-')}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Card className="w-full max-h-[90vh] overflow-y-auto theme-bg-secondary">
      <CardHeader className="sticky top-0 bg-opacity-95 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Auto Insurance Claim Form</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex gap-1"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Status:</span>
          <Badge
            variant={formData.status === 'settled' ? 'default' : 'outline'}
            className="text-xs"
          >
            {formData.status}
          </Badge>
        </div>

        {/* Claimant Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm theme-text-primary">Claimant Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium theme-text-secondary">Name *</label>
              <Input
                value={formData.claimantName}
                onChange={(e) => handleInputChange('claimantName', e.target.value)}
                placeholder="Full name"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium theme-text-secondary">Phone *</label>
              <Input
                value={formData.claimantPhone}
                onChange={(e) => handleInputChange('claimantPhone', e.target.value)}
                placeholder="Phone number"
                type="tel"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Accident Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm theme-text-primary">Accident Details</h3>
          <div>
            <label className="text-xs font-medium theme-text-secondary">Claim Type</label>
            <select
              value={formData.claimType}
              onChange={(e) => handleInputChange('claimType', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm theme-bg-primary"
            >
              <option value="collision">Collision</option>
              <option value="liability">Liability</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="medical">Medical Payment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium theme-text-secondary">Date</label>
              <Input
                type="date"
                value={formData.accidentDate}
                onChange={(e) => handleInputChange('accidentDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium theme-text-secondary">Time</label>
              <Input
                type="time"
                value={formData.accidentTime}
                onChange={(e) => handleInputChange('accidentTime', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium theme-text-secondary">Location</label>
            <Input
              value={formData.accidentLocation}
              onChange={(e) => handleInputChange('accidentLocation', e.target.value)}
              placeholder="Street address, intersection, or description"
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium theme-text-secondary">Police Report #</label>
            <Input
              value={formData.policeReportNumber || ''}
              onChange={(e) => handleInputChange('policeReportNumber', e.target.value)}
              placeholder="Optional"
              className="text-sm"
            />
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm theme-text-primary">Vehicle Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium theme-text-secondary">Year</label>
              <Input
                value={formData.vehicleInfo.year}
                onChange={(e) => handleVehicleInfoChange('year', e.target.value)}
                placeholder="2020"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium theme-text-secondary">Make</label>
              <Input
                value={formData.vehicleInfo.make}
                onChange={(e) => handleVehicleInfoChange('make', e.target.value)}
                placeholder="Toyota"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium theme-text-secondary">Model</label>
              <Input
                value={formData.vehicleInfo.model}
                onChange={(e) => handleVehicleInfoChange('model', e.target.value)}
                placeholder="Camry"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium theme-text-secondary">License Plate</label>
              <Input
                value={formData.vehicleInfo.licensePlate}
                onChange={(e) => handleVehicleInfoChange('licensePlate', e.target.value)}
                placeholder="ABC-1234"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Damage & Injuries */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm theme-text-primary">Damage & Injuries</h3>
          <div>
            <label className="text-xs font-medium theme-text-secondary">Damage Description</label>
            <Textarea
              value={formData.damageDescription}
              onChange={(e) => handleInputChange('damageDescription', e.target.value)}
              placeholder="Describe the extent of vehicle damage..."
              rows={3}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium theme-text-secondary">Injuries Reported</label>
            <Textarea
              value={formData.injuries}
              onChange={(e) => handleInputChange('injuries', e.target.value)}
              placeholder="List any injuries or 'None reported'"
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        {/* Witnesses */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm theme-text-primary">
            Witnesses ({formData.witnesses.length})
          </h3>

          {formData.witnesses.length > 0 && (
            <div className="space-y-2">
              {formData.witnesses.map((witness, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-opacity-50 rounded border text-sm"
                >
                  <span>
                    {witness.name} - {witness.phone}
                  </span>
                  <button
                    onClick={() => removeWitness(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Input
              value={newWitness.name}
              onChange={(e) => setNewWitness({ ...newWitness, name: e.target.value })}
              placeholder="Witness name"
              className="text-sm col-span-2"
            />
            <button
              onClick={addWitness}
              disabled={!newWitness.name || !newWitness.phone}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <Input
            value={newWitness.phone}
            onChange={(e) => setNewWitness({ ...newWitness, phone: e.target.value })}
            placeholder="Witness phone"
            type="tel"
            className="text-sm"
          />
        </div>

        {/* Adjuster Notes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm theme-text-primary">Adjuster Notes</h3>
          <Textarea
            value={formData.insuranceNotes}
            onChange={(e) => handleInputChange('insuranceNotes', e.target.value)}
            placeholder="Additional notes, findings, or assessment details..."
            rows={4}
            className="text-sm"
          />
        </div>

        {/* Save Button */}
        {onSave && (
          <Button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Claim
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ClaimsForm;
