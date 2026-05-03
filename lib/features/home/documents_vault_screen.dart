import 'package:flutter/material.dart';

class DocumentsVaultScreen extends StatefulWidget {
  const DocumentsVaultScreen({super.key});

  @override
  State<DocumentsVaultScreen> createState() => _DocumentsVaultScreenState();
}

class _DocumentsVaultScreenState extends State<DocumentsVaultScreen> {
  static const Color primaryBlue = Color(0xFF1E88E5);
  static const Color darkText = Color(0xFF263238);

  Map<String, Map<String, String?>?> uploadedDocs = {
    'National ID (Front)': {'name': 'id_front.jpg', 'size': '1.2 MB', 'date': '12 Oct 2025'},
    'National ID (Back)': null,
    'Income Certificate': {'name': 'salary_slip.pdf', 'size': '850 KB', 'date': '15 Oct 2025'},
    'Utility Bill': null,
    'Birth Certificate': null,
  };

  void _simulateFileUpload(String docType) {
    // محاكاة لعملية الرفع عشان يشتغل على DartPad أو الموبايل بدون مكتبات خارجية حالياً
    setState(() {
      uploadedDocs[docType] = {
        'name': '${docType.replaceAll(' ', '_').toLowerCase()}.pdf',
        'size': '1.5 MB',
        'date': 'Today'
      };
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("$docType uploaded to your secure vault"),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    int uploadedCount = uploadedDocs.values.where((v) => v != null).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // Header عصري بـ SliverAppBar
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: primaryBlue,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [primaryBlue, Color(0xFF1565C0)]),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    const Icon(Icons.security_rounded, color: Colors.white, size: 40),
                    const SizedBox(height: 10),
                    const Text("Secure Documents Vault",
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    Text("$uploadedCount of ${uploadedDocs.length} files secured",
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
                  ],
                ),
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverList(
              delegate: SliverChildListDelegate(<Widget>[
                _buildStatsRow(uploadedCount, uploadedDocs.length),
                const SizedBox(height: 30),
                const Text("Your Paperwork",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: darkText)),
                const SizedBox(height: 15),
                const SizedBox(height: 40),
                ...uploadedDocs.keys.map((docType) => _buildEnhancedDocCard(docType)),
                _buildSecurityNote(),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  // كروت الإحصائيات العلوية
  Widget _buildStatsRow(int uploaded, int total) {
    return Row(
      children: [
        _statItem("Uploaded", uploaded.toString(), Colors.green),
        const SizedBox(width: 15),
        _statItem("Missing", (total - uploaded).toString(), Colors.orange),
      ],
    );
  }

  Widget _statItem(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedDocCard(String title) {
    var fileData = uploadedDocs[title];
    bool isUploaded = fileData != null;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: isUploaded ? primaryBlue.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isUploaded ? Colors.green.withValues(alpha: 0.1) : Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isUploaded ? Icons.check_circle : Icons.pending_actions_rounded,
              color: isUploaded ? Colors.green : Colors.grey,
              size: 20,
            ),
          ),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          subtitle: Text(isUploaded ? "Verified File" : "Waiting for upload",
              style: TextStyle(color: isUploaded ? Colors.green : Colors.grey, fontSize: 12)),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    if (isUploaded) ...[
                      _fileDetailRow("File Name", fileData['name']!),
                      _fileDetailRow("Size", fileData['size']!),
                      _fileDetailRow("Date", fileData['date']!),
                      const Divider(height: 20),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (isUploaded)
                          TextButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.remove_red_eye_outlined, size: 18),
                            label: const Text("View"),
                          ),
                        ElevatedButton.icon(
                          onPressed: () => _simulateFileUpload(title),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isUploaded ? Colors.white : primaryBlue,
                            foregroundColor: isUploaded ? primaryBlue : Colors.white,
                            elevation: 0,
                            side: isUploaded ? const BorderSide(color: primaryBlue) : BorderSide.none,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: Icon(isUploaded ? Icons.refresh : Icons.upload, size: 18),
                          label: Text(isUploaded ? "Replace" : "Upload Now"),
                        ),
                      ],
                    )
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _fileDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildSecurityNote() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline, color: Colors.amber, size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              "Your files are encrypted and only visible to authorized housing officers during active applications.",
              style: TextStyle(fontSize: 12, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }
}