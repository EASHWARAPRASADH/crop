<?php
/**
 * GOTEK ID - Universal PHP API Bridge
 * Place this file in your Apache/PHP root directory.
 * Ensure you have a 'uploads' folder with write permissions.
 */

// --- CONFIGURATION ---
$db_host = 'localhost';
$db_name = 'gotek_db'; // Change to your database name
$db_user = 'root';     // Change to your MySQL username
$db_pass = '';         // Change to your MySQL password

// --- CORS & HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DATABASE CONNECTION ---
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed", "details" => $e->getMessage()]);
    exit();
}

// --- ROUTING ---
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($path, '/'));

// Simplified Routing for standard ID Project endpoints
// We assume URLs like /api/projects or api.php?route=projects
$resource = end($parts);
$id = isset($_GET['id']) ? $_GET['id'] : null;

// Get JSON Input
$input = json_decode(file_get_contents('php://input'), true);

switch ($resource) {
    case 'projects':
        handleProjects($method, $id, $input, $pdo);
        break;
        
    case 'records':
        $projectId = isset($_GET['projectId']) ? $_GET['projectId'] : null;
        handleRecords($method, $id, $projectId, $input, $pdo);
        break;
        
    case 'upload':
        handleUpload($_FILES, $_POST, $pdo);
        break;

    case 'stats':
        handleStats($pdo);
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Endpoint not found: $resource"]);
        break;
}

// --- HANDLERS ---

function handleProjects($method, $id, $data, $pdo) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM projects ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        }
    } elseif ($method === 'POST') {
        $id = $data['id'] ?? uniqid('proj_');
        $sql = "INSERT INTO projects (id, name, organization, status, template, color) VALUES (?, ?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([
            $id, 
            $data['name'], 
            $data['organization'], 
            $data['status'] ?? 'draft', 
            $data['template'] ?? 'School',
            $data['color'] ?? '#3B82F6'
        ]);
        echo json_encode(["id" => $id, "success" => true]);
    }
}

function handleRecords($method, $id, $projectId, $data, $pdo) {
    if ($method === 'GET') {
        if ($projectId) {
            $stmt = $pdo->prepare("SELECT * FROM records WHERE project_id = ? ORDER BY created_at DESC");
            $stmt->execute([$projectId]);
            $results = $stmt->fetchAll();
            // Decode JSON data field if it exists
            foreach($results as &$r) { if(isset($r['data'])) $r['data'] = json_decode($r['data']); }
            echo json_encode($results);
        }
    } elseif ($method === 'POST') {
        // Handle Bulk Create or Single
        if (isset($data['records'])) {
            foreach ($data['records'] as $record) {
                insertRecord($record, $data['projectId'], $pdo);
            }
            echo json_encode(["status" => "bulk_success"]);
        } else {
            $newId = insertRecord($data, $data['project_id'], $pdo);
            echo json_encode(["id" => $newId, "success" => true]);
        }
    }
}

function insertRecord($record, $projectId, $pdo) {
    $id = $record['id'] ?? uniqid('rec_');
    $sql = "INSERT INTO records (id, project_id, name, photo_url, data) VALUES (?, ?, ?, ?, ?)";
    $pdo->prepare($sql)->execute([
        $id,
        $projectId,
        $record['name'] ?? null,
        $record['photoUrl'] ?? null,
        json_encode($record)
    ]);
    return $id;
}

function handleUpload($files, $post, $pdo) {
    if (!isset($files['file'])) {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded"]);
        return;
    }

    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $file = $files['file'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '.' . $ext;
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode([
            "success" => true,
            "url" => "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/' . $targetPath,
            "path" => $targetPath
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Upload failed"]);
    }
}

function handleStats($pdo) {
    $projects = $pdo->query("SELECT COUNT(*) FROM projects")->fetchColumn();
    $records = $pdo->query("SELECT COUNT(*) FROM records")->fetchColumn();
    echo json_encode([
        "totalProjects" => (int)$projects,
        "totalRecords" => (int)$records
    ]);
}
?>
