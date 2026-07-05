import React, { useState } from 'react';
import { 
  HardDrive, 
  FolderOpen, 
  Search, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Cloud, 
  Database, 
  FileCheck2, 
  Tag, 
  FolderLock,
  Plus,
  Edit2,
  MapPin,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

interface DataManagerViewProps {
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
}

export default function DataManagerView({ projects, onUpdateProject }: DataManagerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [backupFilter, setBackupFilter] = useState<'all' | 'pending' | 'backed_up'>('all');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [hardDiskName, setHardDiskName] = useState('');
  const [dataSize, setDataSize] = useState('');
  const [location, setLocation] = useState('');
  const [rawDataFolder, setRawDataFolder] = useState('');
  const [deliveryFolder, setDeliveryFolder] = useState('');
  const [finalExportFolder, setFinalExportFolder] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [backupStatus, setBackupStatus] = useState<'pending' | 'backed_up'>('pending');

  const [saving, setSaving] = useState(false);

  // Filter projects for storage view
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.coupleName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.hardDiskName && p.hardDiskName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBackup = backupFilter === 'all' || 
                          (backupFilter === 'backed_up' && p.backupStatus === 'backed_up') || 
                          (backupFilter === 'pending' && (!p.backupStatus || p.backupStatus === 'pending'));

    return matchesSearch && matchesBackup;
  });

  const totalBackupCompleted = projects.filter(p => p.backupStatus === 'backed_up').length;
  const totalStorageCapacityNum = projects.reduce((sum, p) => {
    // Parse size e.g. "1.5 TB" to TB
    const sizeStr = p.dataSize || '';
    const num = parseFloat(sizeStr);
    if (isNaN(num)) return sum;
    if (sizeStr.toLowerCase().includes('gb')) return sum + (num / 1024);
    return sum + num;
  }, 0);

  const toggleBackup = async (proj: Project) => {
    const current = proj.backupStatus || 'pending';
    const nextStatus = current === 'pending' ? 'backed_up' : 'pending';
    await onUpdateProject(proj.id, { backupStatus: nextStatus });
  };

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setSelectedProjectId('');
    setHardDiskName('');
    setDataSize('');
    setLocation('');
    setRawDataFolder('');
    setDeliveryFolder('');
    setFinalExportFolder('');
    setGoogleDriveLink('');
    setBackupStatus('pending');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setSelectedProjectId(proj.id);
    setHardDiskName(proj.hardDiskName || '');
    setDataSize(proj.dataSize || '');
    setLocation(proj.location || '');
    setRawDataFolder(proj.rawDataFolder || '');
    setDeliveryFolder(proj.deliveryFolder || '');
    setFinalExportFolder(proj.finalExportFolder || '');
    setGoogleDriveLink(proj.googleDriveLink || '');
    setBackupStatus(proj.backupStatus || 'pending');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projId = editingProject ? editingProject.id : selectedProjectId;
    if (!projId) {
      alert('Please select a project');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<Project> = {
        hardDiskName,
        dataSize,
        location,
        rawDataFolder,
        deliveryFolder,
        finalExportFolder,
        googleDriveLink,
        backupStatus,
      };
      await onUpdateProject(projId, updates);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating storage data:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics overview bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/25 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[10px] font-mono block">AGGREGATE STORAGE SIZE</span>
            <span className="text-xl font-bold font-display text-white mt-1 block">
              {totalStorageCapacityNum.toFixed(2)} Terabytes
            </span>
          </div>
          <div className="p-3 bg-luxury-green-850 rounded-xl">
            <Database className="w-5 h-5 text-gold-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/25 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[10px] font-mono block">BACKUP SYNC MILESTONES</span>
            <span className="text-xl font-bold font-display text-white mt-1 block">
              {totalBackupCompleted} / {projects.length} Wed Films
            </span>
          </div>
          <div className="p-3 bg-emerald-950/20 rounded-xl">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/25 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[10px] font-mono block">OFFLINE HDDS ENGAGED</span>
            <span className="text-xl font-bold font-display text-white mt-1 block">
              {Array.from(new Set(projects.map(p => p.hardDiskName).filter(Boolean))).length} Physical Disks
            </span>
          </div>
          <div className="p-3 bg-blue-950/20 rounded-xl">
            <HardDrive className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-6 rounded-3xl glass-panel relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search storage indexes by Couple, HDD, Location, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-charcoal-900 border border-luxury-green-800/30 rounded-2xl text-sm focus:outline-none focus:border-gold-500/40 text-gray-200 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={backupFilter}
              onChange={(e) => setBackupFilter(e.target.value as any)}
              className="bg-charcoal-900 border border-luxury-green-800/30 px-3.5 py-2.5 rounded-2xl text-xs text-gray-300 focus:outline-none shrink-0 flex-1 sm:flex-none"
            >
              <option value="all">All Backups</option>
              <option value="pending">Backup Pending</option>
              <option value="backed_up">Backed Up</option>
            </select>

            <button
              id="add-data-btn"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold font-sans text-xs rounded-2xl shadow-lg shadow-gold-500/10 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Storage Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Storage Folder list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((p) => {
          return (
            <motion.div
              key={p.id}
              layout
              className="p-6 rounded-3xl glass-panel space-y-4 relative"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-gold-400">{p.id}</span>
                  <h4 className="text-base font-bold text-white font-display mt-0.5">{p.coupleName}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{p.eventType}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Edit button */}
                  <button
                    id={`edit-storage-btn-${p.id}`}
                    onClick={() => handleOpenEditModal(p)}
                    className="p-1.5 rounded-xl bg-charcoal-800/80 border border-white/10 hover:border-gold-500/30 hover:bg-charcoal-700 text-gray-400 hover:text-gold-400 transition-colors cursor-pointer"
                    title="Edit Storage Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`backup-btn-${p.id}`}
                    onClick={() => toggleBackup(p)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[10px] border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      p.backupStatus === 'backed_up' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20'
                    }`}
                  >
                    {p.backupStatus === 'backed_up' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Backed Up</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>Backup Pending</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Data specifications grids with location included */}
              <div className="grid grid-cols-3 gap-4 text-xs font-mono border-t border-luxury-green-800/10 pt-4">
                <div>
                  <span className="text-gray-500 block">HARD DISK LOG</span>
                  <span className="text-white font-sans font-bold mt-1 block truncate" title={p.hardDiskName || 'Unlogged HDD'}>
                    {p.hardDiskName || 'Unlogged HDD'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">FOOTAGE SIZE</span>
                  <span className="text-white font-sans font-bold mt-1 block truncate" title={p.dataSize || 'Unmeasured size'}>
                    {p.dataSize || 'Unmeasured size'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gold-400" /> LOCATION
                  </span>
                  <span className="text-white font-sans font-bold mt-1 block truncate" title={p.location || 'Not Specified'}>
                    {p.location || 'Not Specified'}
                  </span>
                </div>
              </div>

              {/* Directory paths list */}
              <div className="space-y-2 text-xs">
                {p.rawDataFolder && (
                  <div className="p-2.5 bg-charcoal-950/50 rounded-xl border border-luxury-green-800/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">RAW STORAGE</span>
                    <span className="font-mono text-gray-300 text-[11px] truncate pr-4">{p.rawDataFolder}</span>
                  </div>
                )}

                {p.deliveryFolder && (
                  <div className="p-2.5 bg-charcoal-950/50 rounded-xl border border-luxury-green-800/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">DELIVERY FOLDER</span>
                    <span className="font-mono text-gray-300 text-[11px] truncate pr-4">{p.deliveryFolder}</span>
                  </div>
                )}

                {p.finalExportFolder && (
                  <div className="p-2.5 bg-charcoal-950/50 rounded-xl border border-luxury-green-800/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">FINAL EXPORT</span>
                    <span className="font-mono text-gray-300 text-[11px] truncate pr-4">{p.finalExportFolder}</span>
                  </div>
                )}
              </div>

              {p.googleDriveLink && (
                <a
                  href={p.googleDriveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-charcoal-950 hover:bg-black rounded-2xl text-xs text-gold-400 border border-luxury-green-800/20"
                >
                  <span className="truncate font-mono">Google Drive Workspace Path</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              )}
            </motion.div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-2 text-center py-20 text-gray-500 text-sm font-mono">No storage directories match the search framework.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-charcoal-900 border border-white/10 rounded-3xl p-6 md:p-8 overflow-y-auto max-h-[90vh] shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xl font-bold font-serif text-white">
                    {editingProject ? 'Edit Storage Data' : 'Add Storage Data'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {editingProject 
                      ? `Updating storage logs for ${editingProject.coupleName} (${editingProject.id})`
                      : 'Configure storage locations, physical HDDs, and backup states'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-charcoal-800/80 border border-white/5 hover:border-white/10 hover:bg-charcoal-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Select Project (Only on Add) */}
                {!editingProject ? (
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                      Select Project *
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        // Prepopulate if project already has some fields
                        const found = projects.find(p => p.id === e.target.value);
                        if (found) {
                          setHardDiskName(found.hardDiskName || '');
                          setDataSize(found.dataSize || '');
                          setLocation(found.location || '');
                          setRawDataFolder(found.rawDataFolder || '');
                          setDeliveryFolder(found.deliveryFolder || '');
                          setFinalExportFolder(found.finalExportFolder || '');
                          setGoogleDriveLink(found.googleDriveLink || '');
                          setBackupStatus(found.backupStatus || 'pending');
                        }
                      }}
                      required
                      className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium"
                    >
                      <option value="" disabled>-- Choose Wedding Film Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id} className="bg-charcoal-950 text-white">
                          [{p.id}] {p.coupleName} ({p.eventType})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Target Project
                    </span>
                    <div className="p-3 bg-charcoal-950 border border-white/5 rounded-2xl font-medium text-sm text-gray-300">
                      [{editingProject.id}] {editingProject.coupleName} ({editingProject.eventType})
                    </div>
                  </div>
                )}

                {/* 2. Grid for HDD, Size, Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                      Hard Disk Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDD-02 or SEAGATE-4T"
                      value={hardDiskName}
                      onChange={(e) => setHardDiskName(e.target.value)}
                      className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                      Footage Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1.2 TB or 450 GB"
                      value={dataSize}
                      onChange={(e) => setDataSize(e.target.value)}
                      className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gold-400" /> Physical Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shelf A-3, Mumbai Office"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* 3. Folder paths */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    Internal Storage Folder Paths
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                        Raw Footage Path
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. D:/Raw/ProjectName"
                        value={rawDataFolder}
                        onChange={(e) => setRawDataFolder(e.target.value)}
                        className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono placeholder-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                        Delivery Folder Path
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. E:/Delivery/ProjectName"
                        value={deliveryFolder}
                        onChange={(e) => setDeliveryFolder(e.target.value)}
                        className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono placeholder-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                        Final Export Path
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. F:/Exports/ProjectName"
                        value={finalExportFolder}
                        onChange={(e) => setFinalExportFolder(e.target.value)}
                        className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono placeholder-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Google Drive Link */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                    Google Drive Workspace Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={googleDriveLink}
                    onChange={(e) => setGoogleDriveLink(e.target.value)}
                    className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium placeholder-gray-600"
                  />
                </div>

                {/* 5. Backup Status Selector */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2.5">
                    Backup State
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setBackupStatus('pending')}
                      className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        backupStatus === 'pending'
                          ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-md shadow-yellow-500/5'
                          : 'bg-charcoal-950 border-white/5 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span>Backup Pending</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBackupStatus('backed_up')}
                      className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        backupStatus === 'backed_up'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/5'
                          : 'bg-charcoal-950 border-white/5 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Backed Up</span>
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end items-center gap-3 border-t border-white/5 pt-5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-charcoal-800 hover:bg-charcoal-750 text-gray-300 hover:text-white font-medium text-xs rounded-2xl border border-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:opacity-50 text-charcoal-950 font-bold text-xs rounded-2xl shadow-lg shadow-gold-500/10 transition-all cursor-pointer"
                  >
                    {saving ? 'Saving Logs...' : 'Save Storage Log'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
