const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * [NOVA FUNÇÃO DE SETUP]
 * Uma função HTTP para verificar e definir o primeiro Super Admin.
 * É mais segura e fornece feedback claro no navegador e nos logs.
 * Para usar, acesse a URL da função com o email como parâmetro:
 * .../checkAndSetSuperAdmin?email=seuemail@dominio.com
 */
exports.checkAndSetSuperAdmin = functions.https.onRequest(async (req, res) => {
  // Define o cabeçalho para permitir chamadas de qualquer origem (útil para testes)
  res.set('Access-Control-Allow-Origin', '*');

  // Pega o email do parâmetro da URL (ex: ?email=...)
  const email = req.query.email;

  if (!email) {
    functions.logger.warn("Tentativa de chamada sem parâmetro de email.");
    return res.status(400).json({
      status: "error",
      message: "Erro: Forneça um email como parâmetro na URL. Ex: ?email=seuemail@dominio.com"
    });
  }

  functions.logger.log(`Iniciando processo de verificação para o email: ${email}`);

  try {
    // 1. Busca o usuário no Firebase Authentication pelo email
    const userRecord = await admin.auth().getUserByEmail(email);
    functions.logger.log(`Usuário encontrado: ${userRecord.uid}. Claims atuais:`, userRecord.customClaims);

    // 2. Verifica se o usuário já é Super Admin
    if (userRecord.customClaims && userRecord.customClaims.role === 'superAdmin') {
      const message = `O usuário ${email} já possui a permissão de Super Admin.`;
      functions.logger.info(message);
      return res.status(200).json({ status: "skipped", message: message, claims: userRecord.customClaims });
    }

    // 3. Se não for, define a permissão
    functions.logger.log(`Atribuindo a permissão 'superAdmin' para o usuário ${userRecord.uid}...`);
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'superAdmin' });
    
    const successMessage = `Sucesso! O usuário ${email} (UID: ${userRecord.uid}) agora é Super Admin.`;
    functions.logger.log(successMessage);
    
    // Retorna uma resposta de sucesso clara
    return res.status(200).json({ 
        status: "success", 
        message: successMessage,
        newClaims: { role: 'superAdmin' }
    });

  } catch (error) {
    functions.logger.error(`Erro no processo para o email ${email}:`, error);
    
    // Retorna uma resposta de erro clara
    if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
            status: "error",
            code: error.code,
            message: `Usuário com o email '${email}' não foi encontrado no Firebase Authentication. Verifique se o email está correto e se o usuário já foi criado.`
        });
    }

    return res.status(500).json({
        status: "error",
        code: error.code,
        message: `Ocorreu um erro inesperado: ${error.message}`
    });
  }
});


/**
 * Função Callable para atribuir uma role a um usuário. (Mantida como estava)
 * Apenas usuários com a role 'superAdmin' podem chamar esta função.
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== "superAdmin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas Super Admins podem atribuir roles."
    );
  }

  const { email, role } = data;
  const validRoles = ["superAdmin", "siteAdmin", "editor", "autor"];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `A role '${role}' não é uma role válida.`
    );
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: role });
    return {
      message: `Sucesso! O usuário ${email} agora tem a role de ${role}.`,
    };
  } catch (error) {
    console.error("Erro ao definir a role do usuário:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Ocorreu um erro ao processar a sua solicitação."
    );
  }
});