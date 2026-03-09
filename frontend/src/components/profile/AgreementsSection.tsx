import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    QrCode,
    Scan,
    CheckCircle,
    Users,
    Copy
} from 'lucide-react';
import { toast } from 'sonner';

export function AgreementsSection() {
    const { currentUser, establishAgreement, getAllUsers } = useStore();
    const [scanId, setScanId] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    if (!currentUser) return null;

    const handleCopyId = () => {
        navigator.clipboard.writeText(currentUser.uniqueId);
        toast.success('ID copied to clipboard');
    };

    const handleEstablishAgreement = () => {
        if (!scanId.trim()) return;

        setIsScanning(true);
        // Simulate API delay
        setTimeout(() => {
            const result = establishAgreement(scanId);
            if (result.success) {
                toast.success(result.message);
                setScanId('');
            } else {
                toast.error(result.message);
            }
            setIsScanning(false);
        }, 500);
    };

    // Get details of agreed users
    const allUsers = getAllUsers();
    const agreedUsers = allUsers.filter(u => currentUser.agreements?.includes(u.id));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* My Identity Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-blue-600" />
                            My Identity
                        </CardTitle>
                        <CardDescription>
                            Share this QR code or ID with partners to establish agreements
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                            <QRCodeSVG
                                value={currentUser.uniqueId}
                                size={160}
                                level="H"
                                includeMargin
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Unique User ID
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={currentUser.uniqueId}
                                    readOnly
                                    className="font-mono text-center bg-gray-50 tracking-widest font-bold"
                                />
                                <Button variant="outline" size="icon" onClick={handleCopyId}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Establish Agreement Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scan className="w-5 h-5 text-purple-600" />
                            Establish Agreement
                        </CardTitle>
                        <CardDescription>
                            Enter a partner's Unique ID to connect
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Partner Unique ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter 12-char ID"
                                    value={scanId}
                                    onChange={(e) => setScanId(e.target.value)}
                                    maxLength={12}
                                    className="font-mono"
                                />
                                <Button
                                    onClick={handleEstablishAgreement}
                                    disabled={isScanning || !scanId}
                                >
                                    {isScanning ? 'Connecting...' : 'Connect'}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Ensure you are connecting with the correct trusted partner.
                            </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start mt-4">
                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">How it works</p>
                                <p>Establishing an agreement allows you to:</p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Send/Receive direct orders</li>
                                    <li>View authorized inventory</li>
                                    <li>Process automated billing</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Existing Agreements */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Active Partnerships
                    </CardTitle>
                    <CardDescription>
                        List of users you have agreements with
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {agreedUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            No agreements established yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {agreedUsers.map(user => (
                                <div key={user.id} className="p-4 border rounded-lg flex justify-between items-start bg-white shadow-sm">
                                    <div>
                                        <h4 className="font-semibold">{user.name}</h4>
                                        <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                                        <p className="text-xs text-gray-400 font-mono mt-1">{user.uniqueId}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Active
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
