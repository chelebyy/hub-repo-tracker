import { useState } from 'react'
import { Trash2, Plus, Info } from 'lucide-react'
import type { Category } from '@/types'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface Props {
    isOpen: boolean
    onClose: () => void
    categories: Category[]
    onUpdate: () => void
}

export function CategoryManagerModal({ isOpen, onClose, categories, onUpdate }: Props) {
    const [newCatName, setNewCatName] = useState('')
    const [newCatColor, setNewCatColor] = useState('#6366f1')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const customCategories = categories.filter(c => c.type === 'custom')

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCatName.trim()) return

        setLoading(true)
        setError(null)
        try {
            await api.createCategory({ name: newCatName, color: newCatColor, type: 'custom' })
            setNewCatName('')
            onUpdate()
        } catch {
            setError('Failed to create category')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this category? Repositories will not be deleted.')) return

        try {
            await api.deleteCategory(id)
            onUpdate()
        } catch {
            setError('Failed to delete category')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Categories</DialogTitle>
                    <DialogDescription>
                        Create custom categories to organize your repositories.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Create New */}
                    <form onSubmit={handleCreate} className="grid gap-4">
                        <div className="flex items-end gap-2">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="name">New Category Name</Label>
                                <Input
                                    id="name"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="e.g. Work Projects"
                                    maxLength={20}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="color" className="sr-only">Color</Label>
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-md border bg-background p-1 shadow-sm">
                                    <input
                                        id="color"
                                        type="color"
                                        value={newCatColor}
                                        onChange={(e) => setNewCatColor(e.target.value)}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                    <div
                                        className="h-6 w-6 rounded-full border shadow-sm"
                                        style={{ backgroundColor: newCatColor }}
                                    />
                                </div>
                            </div>
                            <Button type="submit" size="icon" disabled={loading || !newCatName.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    </form>

                    <Separator />

                    {/* List */}
                    <div className="grid gap-2">
                        <h4 className="text-sm font-medium leading-none">Your Categories</h4>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                            {customCategories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 pt-8">
                                    <Info className="h-8 w-8 opacity-20" />
                                    <p className="text-sm">No custom categories yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {customCategories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-3 w-3 rounded-full ring-1 ring-border"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                <span className="text-sm font-medium">{cat.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(cat.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
