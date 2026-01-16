import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0?module";

class AIAutomationBuilderPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      narrow: { type: Boolean },
      route: { type: Object },
      currentTab: { type: String },
      yamlOutput: { type: String },
      validationResult: { type: Object },
      previewResult: { type: Object },
      testResult: { type: Object },
      dryRunResult: { type: Object },
      isLoading: { type: Boolean },
      isAnalyzing: { type: Boolean },
      isTesting: { type: Boolean },
      isSimulating: { type: Boolean },
      entities: { type: Array },
      entitySuggestions: { type: Array },
      showEntityPicker: { type: Boolean },
      selectedEntityForReplacement: { type: String },
      entitySearchQuery: { type: String }
    };
  }

  constructor() {
    super();
    this.currentTab = 'generate';
    this.yamlOutput = '';
    this.validationResult = null;
    this.previewResult = null;
    this.testResult = null;
    this.dryRunResult = null;
    this.isLoading = false;
    this.isAnalyzing = false;
    this.isTesting = false;
    this.isSimulating = false;
    this.entities = [];
    this.entitySuggestions = [];
    this.showEntityPicker = false;
    this.selectedEntityForReplacement = null;
    this.entitySearchQuery = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadEntities();
  }

  async loadEntities() {
    try {
      const result = await this._callWebSocket('ai_automation_builder/get_entities', {});
      if (result.entities) {
        // Flatten entities into a single array with domain info
        this.entities = [];
        Object.keys(result.entities).forEach(domain => {
          result.entities[domain].forEach(entity => {
            this.entities.push({
              ...entity,
              domain: domain,
              friendly_name: entity.name || entity.id
            });
          });
        });
      }
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  }

  get translations() {
    return {
      it: {
        title: '🧠 AI Automation Builder',
        connected: 'Connesso',
        placeholder: 'Descrivi l\'automazione (es: Accendi luci alle 20:00)...',
        generate: '🧠 Genera Automazione',
        export: '📥 Copia YAML',
        validate: '✅ Valida YAML',
        tabs: { flow: '📊 Flow', yaml: '📝 YAML', validate: '✅ Validazione', preview: '👁️ Anteprima', test: '🧪 Test' },
        templates: 'Template rapidi:',
        template1: 'Luci notturne',
        template2: 'Antintrusione',
        template3: 'Lavatrice',
        generating: '⏳ Generando...',
        error: '❌ Errore',
        success: '✅ Successo',
        validYaml: '✅ YAML valido!',
        invalidYaml: '❌ YAML non valido:',
        preview: '👁️ Anteprima',
        testRun: '🧪 Test Esecuzione',
        dryRun: '🔍 Simulazione',
        previewDesc: 'Analizza cosa farà l\'automazione',
        testDesc: 'Esegui una volta per testare',
        dryRunDesc: 'Simula senza effetti reali',
        analyzing: '🔍 Analizzando...',
        testing: '🧪 Testando...',
        simulating: '🔍 Simulando...',
        entityNotFound: 'Entità non trovata',
        replaceEntity: '🔄 Sostituisci Entità',
        searchEntity: 'Cerca entità...',
        selectEntity: 'Seleziona un\'entità',
        entityReplaced: 'Entità sostituita con successo',
        noEntitiesFound: 'Nessuna entità trovata',
        suggestedEntities: 'Entità suggerite:',
        cancel: 'Annulla',
        copyManually: 'Seleziona e copia manualmente il codice YAML',
        goToAutomations: 'Vai alle automazioni?',
        warnings: 'Avvisi',
        triggers: 'Trigger',
        conditions: 'Condizioni',
        actions: 'Azioni',
        entitiesInvolved: 'Entità Coinvolte',
        testResults: 'Risultati Test',
        testSuccess: 'Test completato con successo',
        testFailed: 'Test fallito',
        executedActions: 'Azioni Eseguite',
        errors: 'Errori',
        simulationResults: 'Risultati Simulazione',
        wouldExecuteActions: 'Azioni che verrebbero eseguite',
        predictedStateChanges: 'Cambiamenti di Stato Previsti',
        clickPreview: 'Clicca su "Anteprima" per analizzare l\'automazione...',
        general: 'Generale',
        templatePrompts: {
          template1: 'Accendi le luci del salotto alle 20:00',
          template2: 'Invia notifica se la porta si apre di notte',
          template3: 'Notificami quando la lavatrice ha finito'
        }
      },
      en: {
        title: '🧠 AI Automation Builder',
        connected: 'Connected',
        placeholder: 'Describe your automation (e.g., Turn on lights at 8 PM)...',
        generate: '🧠 Generate Automation',
        export: '📥 Copy YAML',
        validate: '✅ Validate YAML',
        tabs: { flow: '📊 Flow', yaml: '📝 YAML', validate: '✅ Validation', preview: '👁️ Preview', test: '🧪 Test' },
        templates: 'Quick templates:',
        template1: 'Night lights',
        template2: 'Intrusion alert',
        template3: 'Washer done',
        generating: '⏳ Generating...',
        error: '❌ Error',
        success: '✅ Success',
        validYaml: '✅ YAML is valid!',
        invalidYaml: '❌ YAML is invalid:',
        preview: '👁️ Preview',
        testRun: '🧪 Test Run',
        dryRun: '🔍 Dry Run',
        previewDesc: 'Analyze what the automation will do',
        testDesc: 'Execute once to test',
        dryRunDesc: 'Simulate without real effects',
        analyzing: '🔍 Analyzing...',
        testing: '🧪 Testing...',
        simulating: '🔍 Simulating...',
        entityNotFound: 'Entity not found',
        replaceEntity: '🔄 Replace Entity',
        searchEntity: 'Search entity...',
        selectEntity: 'Select an entity',
        entityReplaced: 'Entity replaced successfully',
        noEntitiesFound: 'No entities found',
        suggestedEntities: 'Suggested entities:',
        cancel: 'Cancel',
        copyManually: 'Select and copy the YAML code manually',
        goToAutomations: 'Go to automations?',
        warnings: 'Warnings',
        triggers: 'Triggers',
        conditions: 'Conditions',
        actions: 'Actions',
        entitiesInvolved: 'Entities Involved',
        testResults: 'Test Results',
        testSuccess: 'Test completed successfully',
        testFailed: 'Test failed',
        executedActions: 'Executed Actions',
        errors: 'Errors',
        simulationResults: 'Simulation Results',
        wouldExecuteActions: 'Actions that would be executed',
        predictedStateChanges: 'Predicted State Changes',
        clickPreview: 'Click "Preview" to analyze the automation...',
        general: 'General',
        templatePrompts: {
          template1: 'Turn on living room lights at 8:00 PM',
          template2: 'Send notification if door opens at night',
          template3: 'Notify me when washing machine is done'
        }
      },
      es: {
        title: '🧠 AI Automation Builder',
        connected: 'Conectado',
        placeholder: 'Describe tu automatización (ej: Encender luces a las 20:00)...',
        generate: '🧠 Generar Automatización',
        export: '📥 Copiar YAML',
        validate: '✅ Validar YAML',
        tabs: { flow: '📊 Flujo', yaml: '📝 YAML', validate: '✅ Validación', preview: '👁️ Vista Previa', test: '🧪 Prueba' },
        templates: 'Plantillas rápidas:',
        template1: 'Luces nocturnas',
        template2: 'Alerta de intrusión',
        template3: 'Lavadora terminada',
        generating: '⏳ Generando...',
        error: '❌ Error',
        success: '✅ Éxito',
        validYaml: '✅ ¡YAML válido!',
        invalidYaml: '❌ YAML inválido:',
        preview: '👁️ Vista Previa',
        testRun: '🧪 Ejecutar Prueba',
        dryRun: '🔍 Simulación',
        previewDesc: 'Analizar qué hará la automatización',
        testDesc: 'Ejecutar una vez para probar',
        dryRunDesc: 'Simular sin efectos reales',
        analyzing: '🔍 Analizando...',
        testing: '🧪 Probando...',
        simulating: '🔍 Simulando...',
        entityNotFound: 'Entidad no encontrada',
        replaceEntity: '🔄 Reemplazar Entidad',
        searchEntity: 'Buscar entidad...',
        selectEntity: 'Seleccionar una entidad',
        entityReplaced: 'Entidad reemplazada con éxito',
        noEntitiesFound: 'No se encontraron entidades',
        suggestedEntities: 'Entidades sugeridas:',
        cancel: 'Cancelar',
        copyManually: 'Selecciona y copia el código YAML manualmente',
        goToAutomations: '¿Ir a las automatizaciones?',
        warnings: 'Avisos',
        triggers: 'Disparadores',
        conditions: 'Condiciones',
        actions: 'Acciones',
        entitiesInvolved: 'Entidades Involucradas',
        testResults: 'Resultados de Prueba',
        testSuccess: 'Prueba completada con éxito',
        testFailed: 'Prueba fallida',
        executedActions: 'Acciones Ejecutadas',
        errors: 'Errores',
        simulationResults: 'Resultados de Simulación',
        wouldExecuteActions: 'Acciones que se ejecutarían',
        predictedStateChanges: 'Cambios de Estado Previstos',
        clickPreview: 'Haz clic en "Vista Previa" para analizar la automatización...',
        general: 'General',
        templatePrompts: {
          template1: 'Encender las luces del salón a las 20:00',
          template2: 'Enviar notificación si la puerta se abre por la noche',
          template3: 'Notificarme cuando termine la lavadora'
        }
      },
      fr: {
        title: '🧠 AI Automation Builder',
        connected: 'Connecté',
        placeholder: 'Décrivez votre automatisation (ex: Allumer les lumières à 20h00)...',
        generate: '🧠 Générer Automatisation',
        export: '📥 Copier YAML',
        validate: '✅ Valider YAML',
        tabs: { flow: '📊 Flux', yaml: '📝 YAML', validate: '✅ Validation', preview: '👁️ Aperçu', test: '🧪 Test' },
        templates: 'Modèles rapides:',
        template1: 'Éclairage nocturne',
        template2: 'Alerte intrusion',
        template3: 'Lave-linge terminé',
        generating: '⏳ Génération...',
        error: '❌ Erreur',
        success: '✅ Succès',
        validYaml: '✅ YAML valide !',
        invalidYaml: '❌ YAML invalide :',
        preview: '👁️ Aperçu',
        testRun: '🧪 Test d\'Exécution',
        dryRun: '🔍 Simulation',
        previewDesc: 'Analyser ce que fera l\'automatisation',
        testDesc: 'Exécuter une fois pour tester',
        dryRunDesc: 'Simuler sans effets réels',
        analyzing: '🔍 Analyse...',
        testing: '🧪 Test...',
        simulating: '🔍 Simulation...',
        entityNotFound: 'Entité non trouvée',
        replaceEntity: '🔄 Remplacer l\'Entité',
        searchEntity: 'Rechercher une entité...',
        selectEntity: 'Sélectionner une entité',
        entityReplaced: 'Entité remplacée avec succès',
        noEntitiesFound: 'Aucune entité trouvée',
        suggestedEntities: 'Entités suggérées:',
        cancel: 'Annuler',
        copyManually: 'Sélectionnez et copiez le code YAML manuellement',
        goToAutomations: 'Aller aux automatisations?',
        warnings: 'Avertissements',
        triggers: 'Déclencheurs',
        conditions: 'Conditions',
        actions: 'Actions',
        entitiesInvolved: 'Entités Impliquées',
        testResults: 'Résultats du Test',
        testSuccess: 'Test terminé avec succès',
        testFailed: 'Test échoué',
        executedActions: 'Actions Exécutées',
        errors: 'Erreurs',
        simulationResults: 'Résultats de Simulation',
        wouldExecuteActions: 'Actions qui seraient exécutées',
        predictedStateChanges: 'Changements d\'État Prévus',
        clickPreview: 'Cliquez sur "Aperçu" pour analyser l\'automatisation...',
        general: 'Général',
        templatePrompts: {
          template1: 'Allumer les lumières du salon à 20h00',
          template2: 'Envoyer une notification si la porte s\'ouvre la nuit',
          template3: 'Me notifier quand le lave-linge a terminé'
        }
      },
      de: {
        title: '🧠 AI Automation Builder',
        connected: 'Verbunden',
        placeholder: 'Beschreiben Sie Ihre Automatisierung (z.B.: Lichter um 20:00 einschalten)...',
        generate: '🧠 Automatisierung Generieren',
        export: '📥 YAML Kopieren',
        validate: '✅ YAML Validieren',
        tabs: { flow: '📊 Ablauf', yaml: '📝 YAML', validate: '✅ Validierung', preview: '👁️ Vorschau', test: '🧪 Test' },
        templates: 'Schnelle Vorlagen:',
        template1: 'Nachtbeleuchtung',
        template2: 'Einbruchsalarm',
        template3: 'Waschmaschine fertig',
        generating: '⏳ Generiere...',
        error: '❌ Fehler',
        success: '✅ Erfolg',
        validYaml: '✅ YAML ist gültig!',
        invalidYaml: '❌ YAML ist ungültig:',
        preview: '👁️ Vorschau',
        testRun: '🧪 Test Ausführung',
        dryRun: '🔍 Simulation',
        previewDesc: 'Analysieren was die Automatisierung tun wird',
        testDesc: 'Einmal ausführen zum Testen',
        dryRunDesc: 'Simulieren ohne echte Effekte',
        analyzing: '🔍 Analysiere...',
        testing: '🧪 Teste...',
        simulating: '🔍 Simuliere...',
        entityNotFound: 'Entität nicht gefunden',
        replaceEntity: '🔄 Entität Ersetzen',
        searchEntity: 'Entität suchen...',
        selectEntity: 'Entität auswählen',
        entityReplaced: 'Entität erfolgreich ersetzt',
        noEntitiesFound: 'Keine Entitäten gefunden',
        suggestedEntities: 'Vorgeschlagene Entitäten:',
        cancel: 'Abbrechen',
        copyManually: 'YAML-Code manuell auswählen und kopieren',
        goToAutomations: 'Zu Automatisierungen gehen?',
        warnings: 'Warnungen',
        triggers: 'Auslöser',
        conditions: 'Bedingungen',
        actions: 'Aktionen',
        entitiesInvolved: 'Beteiligte Entitäten',
        testResults: 'Testergebnisse',
        testSuccess: 'Test erfolgreich abgeschlossen',
        testFailed: 'Test fehlgeschlagen',
        executedActions: 'Ausgeführte Aktionen',
        errors: 'Fehler',
        simulationResults: 'Simulationsergebnisse',
        wouldExecuteActions: 'Aktionen, die ausgeführt würden',
        predictedStateChanges: 'Vorhergesagte Zustandsänderungen',
        clickPreview: 'Klicken Sie auf "Vorschau", um die Automatisierung zu analysieren...',
        general: 'Allgemein',
        templatePrompts: {
          template1: 'Wohnzimmerlichter um 20:00 einschalten',
          template2: 'Benachrichtigung senden wenn Tür nachts geöffnet wird',
          template3: 'Benachrichtigen wenn Waschmaschine fertig ist'
        }
      },
      pt: {
        title: '🧠 AI Automation Builder',
        connected: 'Conectado',
        placeholder: 'Descreva sua automação (ex: Ligar luzes às 20:00)...',
        generate: '🧠 Gerar Automação',
        export: '📥 Copiar YAML',
        validate: '✅ Validar YAML',
        tabs: { flow: '📊 Fluxo', yaml: '📝 YAML', validate: '✅ Validação', preview: '👁️ Pré-visualização', test: '🧪 Teste' },
        templates: 'Modelos rápidos:',
        template1: 'Luzes noturnas',
        template2: 'Alerta de intrusão',
        template3: 'Máquina de lavar',
        generating: '⏳ Gerando...',
        error: '❌ Erro',
        success: '✅ Sucesso',
        validYaml: '✅ YAML válido!',
        invalidYaml: '❌ YAML inválido:',
        preview: '👁️ Pré-visualização',
        testRun: '🧪 Executar Teste',
        dryRun: '🔍 Simulação',
        previewDesc: 'Analisar o que a automação fará',
        testDesc: 'Executar uma vez para testar',
        dryRunDesc: 'Simular sem efeitos reais',
        analyzing: '🔍 Analisando...',
        testing: '🧪 Testando...',
        simulating: '🔍 Simulando...',
        entityNotFound: 'Entidade não encontrada',
        replaceEntity: '🔄 Substituir Entidade',
        searchEntity: 'Pesquisar entidade...',
        selectEntity: 'Selecionar uma entidade',
        entityReplaced: 'Entidade substituída com sucesso',
        noEntitiesFound: 'Nenhuma entidade encontrada',
        suggestedEntities: 'Entidades sugeridas:',
        cancel: 'Cancelar',
        copyManually: 'Selecione e copie o código YAML manualmente',
        goToAutomations: 'Ir para automatizações?',
        warnings: 'Avisos',
        triggers: 'Gatilhos',
        conditions: 'Condições',
        actions: 'Ações',
        entitiesInvolved: 'Entidades Envolvidas',
        testResults: 'Resultados do Teste',
        testSuccess: 'Teste concluído com sucesso',
        testFailed: 'Teste falhou',
        executedActions: 'Ações Executadas',
        errors: 'Erros',
        simulationResults: 'Resultados da Simulação',
        wouldExecuteActions: 'Ações que seriam executadas',
        predictedStateChanges: 'Mudanças de Estado Previstas',
        clickPreview: 'Clique em "Pré-visualização" para analisar a automação...',
        general: 'Geral',
        templatePrompts: {
          template1: 'Ligar as luzes da sala às 20:00',
          template2: 'Enviar notificação se a porta abrir à noite',
          template3: 'Me notificar quando a máquina de lavar terminar'
        }
      },
      nl: {
        title: '🧠 AI Automation Builder',
        connected: 'Verbonden',
        placeholder: 'Beschrijf je automatisering (bijv: Lichten aanzetten om 20:00)...',
        generate: '🧠 Automatisering Genereren',
        export: '📥 YAML Kopiëren',
        validate: '✅ YAML Valideren',
        tabs: { flow: '📊 Stroom', yaml: '📝 YAML', validate: '✅ Validatie', preview: '👁️ Voorbeeld', test: '🧪 Test' },
        templates: 'Snelle sjablonen:',
        template1: 'Nachtverlichting',
        template2: 'Inbraakmelding',
        template3: 'Wasmachine klaar',
        generating: '⏳ Genereren...',
        error: '❌ Fout',
        success: '✅ Succes',
        validYaml: '✅ YAML is geldig!',
        invalidYaml: '❌ YAML is ongeldig:',
        preview: '👁️ Voorbeeld',
        testRun: '🧪 Test Uitvoering',
        dryRun: '🔍 Simulatie',
        previewDesc: 'Analyseren wat de automatisering zal doen',
        testDesc: 'Eenmaal uitvoeren om te testen',
        dryRunDesc: 'Simuleren zonder echte effecten',
        analyzing: '🔍 Analyseren...',
        testing: '🧪 Testen...',
        simulating: '🔍 Simuleren...',
        entityNotFound: 'Entiteit niet gevonden',
        replaceEntity: '🔄 Entiteit Vervangen',
        searchEntity: 'Entiteit zoeken...',
        selectEntity: 'Selecteer een entiteit',
        entityReplaced: 'Entiteit succesvol vervangen',
        noEntitiesFound: 'Geen entiteiten gevonden',
        suggestedEntities: 'Voorgestelde entiteiten:',
        cancel: 'Annuleren',
        copyManually: 'Selecteer en kopieer de YAML-code handmatig',
        goToAutomations: 'Naar automatiseringen gaan?',
        warnings: 'Waarschuwingen',
        triggers: 'Triggers',
        conditions: 'Voorwaarden',
        actions: 'Acties',
        entitiesInvolved: 'Betrokken Entiteiten',
        testResults: 'Testresultaten',
        testSuccess: 'Test succesvol voltooid',
        testFailed: 'Test mislukt',
        executedActions: 'Uitgevoerde Acties',
        errors: 'Fouten',
        simulationResults: 'Simulatieresultaten',
        wouldExecuteActions: 'Acties die zouden worden uitgevoerd',
        predictedStateChanges: 'Voorspelde Statuswijzigingen',
        clickPreview: 'Klik op "Voorbeeld" om de automatisering te analyseren...',
        general: 'Algemeen',
        templatePrompts: {
          template1: 'Woonkamerverlichting aanzetten om 20:00',
          template2: 'Melding sturen als deur \'s nachts opengaat',
          template3: 'Mij waarschuwen wanneer wasmachine klaar is'
        }
      }
    };
  }

  get t() {
    const lang = this.hass?.locale?.language || 'en';
    const supportedLanguages = ['it', 'en', 'es', 'fr', 'de', 'pt', 'nl'];
    
    // Se la lingua è supportata, usala direttamente
    if (supportedLanguages.includes(lang)) {
      return this.translations[lang] || this.translations.en;
    }
    
    // Fallback per varianti linguistiche (es: en-US -> en, pt-BR -> pt)
    const baseLang = lang.split('-')[0];
    if (supportedLanguages.includes(baseLang)) {
      return this.translations[baseLang] || this.translations.en;
    }
    
    // Fallback finale all'inglese
    return this.translations.en;
  }

  async generateAutomation() {
    const prompt = this.shadowRoot.querySelector('#prompt-input')?.value;
    if (!prompt) {
      this._showNotification(this.t.error + ' - ' + this.t.placeholder, 'error');
      return;
    }

    this.isLoading = true;
    this.requestUpdate();

    try {
      // Ottieni la lingua corrente dell'utente
      const lang = this.hass?.locale?.language || 'en';
      const baseLang = lang.split('-')[0];
      
      const result = await this._callWebSocket('ai_automation_builder/build_automation', {
        prompt: prompt,
        language: baseLang
      });
      
      if (result.success) {
        this.yamlOutput = result.yaml;
        this.currentTab = 'yaml';
        this._showNotification(this.t.success + ' - Automazione generata!', 'success');
        this.requestUpdate();
      } else {
        this._showNotification(this.t.error + ': ' + (result.error || 'Unknown'), 'error');
      }
    } catch (error) {
      this._showNotification(this.t.error + ': ' + error.message, 'error');
      console.error('WebSocket error:', error);
    } finally {
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  async validateYAML() {
    if (!this.yamlOutput) {
      this._showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
      return;
    }

    try {
      const result = await this._callWebSocket('ai_automation_builder/validate_yaml', {
        yaml: this.yamlOutput
      });
      this.validationResult = result;
      this.currentTab = 'validate';
      this.requestUpdate();
    } catch (error) {
      this._showNotification(this.t.error + ': ' + error.message, 'error');
    }
  }

  async previewAutomation() {
    if (!this.yamlOutput) {
      this._showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
      return;
    }

    this.isAnalyzing = true;
    this.requestUpdate();

    try {
      // Ottieni la lingua corrente dell'utente
      const lang = this.hass?.locale?.language || 'en';
      const baseLang = lang.split('-')[0];
      
      const result = await this._callWebSocket('ai_automation_builder/preview_automation', {
        yaml: this.yamlOutput,
        language: baseLang
      });
      
      if (result.success) {
        this.previewResult = result.preview;
        this.currentTab = 'preview';
        this._showNotification(this.t.success + ' - Anteprima generata!', 'success');
      } else {
        this._showNotification(this.t.error + ': ' + (result.error || 'Unknown'), 'error');
      }
    } catch (error) {
      this._showNotification(this.t.error + ': ' + error.message, 'error');
    } finally {
      this.isAnalyzing = false;
      this.requestUpdate();
    }
  }

  async testAutomation() {
    if (!this.yamlOutput) {
      this._showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
      return;
    }

    this.isTesting = true;
    this.requestUpdate();

    try {
      // Ottieni la lingua corrente dell'utente
      const lang = this.hass?.locale?.language || 'en';
      const baseLang = lang.split('-')[0];
      
      const result = await this._callWebSocket('ai_automation_builder/test_automation', {
        yaml: this.yamlOutput,
        language: baseLang
      });
      
      if (result.success) {
        this.testResult = result.result;
        this.currentTab = 'test';
        this._showNotification(this.t.success + ' - Test completato!', 'success');
      } else {
        this._showNotification(this.t.error + ': ' + (result.error || 'Unknown'), 'error');
      }
    } catch (error) {
      this._showNotification(this.t.error + ': ' + error.message, 'error');
    } finally {
      this.isTesting = false;
      this.requestUpdate();
    }
  }

  async dryRunAutomation() {
    if (!this.yamlOutput) {
      this._showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
      return;
    }

    this.isSimulating = true;
    this.requestUpdate();

    try {
      // Ottieni la lingua corrente dell'utente
      const lang = this.hass?.locale?.language || 'en';
      const baseLang = lang.split('-')[0];
      
      const result = await this._callWebSocket('ai_automation_builder/dry_run_automation', {
        yaml: this.yamlOutput,
        language: baseLang
      });
      
      if (result.success) {
        this.dryRunResult = result.simulation;
        this.currentTab = 'test'; // Usa lo stesso tab per dry run
        this._showNotification(this.t.success + ' - Simulazione completata!', 'success');
      } else {
        this._showNotification(this.t.error + ': ' + (result.error || 'Unknown'), 'error');
      }
    } catch (error) {
      this._showNotification(this.t.error + ': ' + error.message, 'error');
    } finally {
      this.isSimulating = false;
      this.requestUpdate();
    }
  }

  getSuggestedEntities(missingEntity) {
    if (!missingEntity || !this.entities.length) return [];

    // Extract domain from entity_id (e.g., "light.living_room" -> "light")
    const parts = missingEntity.split('.');
    const targetDomain = parts[0];
    const targetName = parts.slice(1).join('.');

    // Score entities based on similarity
    const scored = this.entities.map(entity => {
      let score = 0;
      
      // Same domain gets high priority
      if (entity.domain === targetDomain) {
        score += 100;
      }
      
      // Name similarity (simple substring matching)
      const entityName = entity.id.toLowerCase();
      const searchName = targetName.toLowerCase();
      
      if (entityName.includes(searchName)) {
        score += 50;
      }
      
      // Word matching
      const searchWords = searchName.split('_');
      searchWords.forEach(word => {
        if (entityName.includes(word)) {
          score += 10;
        }
      });
      
      // Friendly name matching
      const friendlyName = entity.friendly_name.toLowerCase();
      if (friendlyName.includes(searchName)) {
        score += 30;
      }
      
      return { entity, score };
    });

    // Sort by score and return top 5
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.entity);
  }

  openEntityPicker(entityId) {
    this.selectedEntityForReplacement = entityId;
    this.entitySearchQuery = '';
    this.entitySuggestions = this.getSuggestedEntities(entityId);
    this.showEntityPicker = true;
    this.requestUpdate();
  }

  closeEntityPicker() {
    this.showEntityPicker = false;
    this.selectedEntityForReplacement = null;
    this.entitySearchQuery = '';
    this.entitySuggestions = [];
    this.requestUpdate();
  }

  searchEntities(query) {
    this.entitySearchQuery = query;
    
    if (!query) {
      this.entitySuggestions = this.getSuggestedEntities(this.selectedEntityForReplacement);
    } else {
      const lowerQuery = query.toLowerCase();
      this.entitySuggestions = this.entities
        .filter(entity => 
          entity.id.toLowerCase().includes(lowerQuery) ||
          entity.friendly_name.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 10);
    }
    
    this.requestUpdate();
  }

  replaceEntity(oldEntityId, newEntityId) {
    if (!this.yamlOutput || !oldEntityId || !newEntityId) return;

    // Replace all occurrences of the old entity with the new one
    const regex = new RegExp(oldEntityId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    this.yamlOutput = this.yamlOutput.replace(regex, newEntityId);
    
    // Update preview if it exists
    if (this.previewResult) {
      this.previewAutomation();
    }
    
    this.closeEntityPicker();
    this._showNotification(this.t.entityReplaced + ': ' + newEntityId, 'success');
    this.requestUpdate();
  }

  async exportYAML() {
    if (!this.yamlOutput) {
      this._showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
      return;
    }

    // Strategia 1: Clipboard API moderna (preferita)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(this.yamlOutput);
        this._showNotification('✅ ' + this.t.success + ' - Codice copiato!', 'success');
        
        // Opzionale: reindirizza dopo un breve delay
        setTimeout(() => {
          if (confirm(this.t.goToAutomations || 'Vai alle automazioni?')) {
            window.location.href = '/config/automation/dashboard';
          }
        }, 1000);
        return;
      } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err);
      }
    }

    // Strategia 2: execCommand (fallback per browser più vecchi)
    try {
      const success = this.copyUsingExecCommand(this.yamlOutput);
      if (success) {
        this._showNotification('✅ ' + this.t.success + ' - Codice copiato!', 'success');
        return;
      }
    } catch (err) {
      console.warn('execCommand failed, trying manual selection:', err);
    }

    // Strategia 3: Selezione manuale con textarea temporanea
    try {
      this.copyUsingTempTextarea(this.yamlOutput);
      this._showNotification('✅ ' + this.t.success + ' - Codice copiato!', 'success');
      return;
    } catch (err) {
      console.error('All copy methods failed:', err);
    }

    // Strategia 4: Fallback finale - mostra il YAML per copia manuale
    this.currentTab = 'yaml';
    this._showNotification('⚠️ ' + this.t.copyManually, 'warning');
    this.requestUpdate();
    
    // Seleziona automaticamente il testo YAML
    setTimeout(() => {
      this.selectYamlText();
    }, 100);
  }

  copyUsingExecCommand(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('execCommand error:', err);
    }
    
    document.body.removeChild(textarea);
    return success;
  }

  copyUsingTempTextarea(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    
    document.body.appendChild(textarea);
    
    // iOS Safari workaround
    const range = document.createRange();
    range.selectNodeContents(textarea);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    textarea.setSelectionRange(0, text.length);
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('Temp textarea copy error:', err);
    }
    
    document.body.removeChild(textarea);
    
    if (!success) {
      throw new Error('Copy failed');
    }
  }

  selectYamlText() {
    const yamlElement = this.shadowRoot.querySelector('.yaml-output');
    if (yamlElement) {
      const range = document.createRange();
      range.selectNodeContents(yamlElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  setTemplate(prompt) {
    const input = this.shadowRoot.querySelector('#prompt-input');
    if (input) {
      input.value = prompt;
      input.focus();
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.requestUpdate();
  }

  toggleMenu() {
    // Trigger Home Assistant menu
    const event = new CustomEvent('hass-toggle-menu', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  async _callWebSocket(command, data = {}) {
    return new Promise((resolve, reject) => {
      const messageId = Math.floor(Math.random() * 1000000);
      
      const messageHandler = (event) => {
        const msg = event.detail;
        if (msg.id === messageId) {
          this.hass.connection.removeEventListener('message', messageHandler);
          
          if (msg.success !== undefined || msg.type === 'result') {
            resolve(msg);
          } else if (msg.error) {
            reject(new Error(msg.error.message || 'WebSocket error'));
          }
        }
      };

      this.hass.connection.addEventListener('message', messageHandler);
      
      this.hass.connection.sendMessagePromise({
        id: messageId,
        type: command,
        ...data
      }).then(resolve).catch(reject);

      setTimeout(() => {
        this.hass.connection.removeEventListener('message', messageHandler);
        reject(new Error('Timeout - richiesta scaduta'));
      }, 60000);
    });
  }

  _showNotification(message, type) {
    if (this.hass?.callService) {
      this.hass.callService('persistent_notification', 'create', {
        notification_id: 'ai_automation_builder_' + Date.now(),
        message: message,
        title: 'AI Automation Builder'
      });
    } else {
      console.log(message);
    }
  }

  render() {
    return html`
      <div class="header-bar">
        <button class="menu-button" @click="${this.toggleMenu}">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
          </svg>
        </button>
        <h1>${this.t.title}</h1>
        <span class="status">✓ ${this.t.connected}</span>
      </div>

      <div class="container">
        <div class="input-section">
          <textarea id="prompt-input" placeholder="${this.t.placeholder}"></textarea>
          <div class="button-group">
            <button class="btn btn-primary" @click="${this.generateAutomation}" ?disabled="${this.isLoading}">
              ${this.isLoading ? this.t.generating : this.t.generate}
            </button>
            <button class="btn btn-secondary" @click="${this.validateYAML}">
              ${this.t.validate}
            </button>
            <button class="btn btn-secondary" @click="${this.exportYAML}">
              ${this.t.export}
            </button>
          </div>
          <div class="button-group secondary-buttons">
            <button class="btn btn-info" @click="${this.previewAutomation}" ?disabled="${this.isAnalyzing}">
              ${this.isAnalyzing ? this.t.analyzing : this.t.preview}
            </button>
            <button class="btn btn-warning" @click="${this.testAutomation}" ?disabled="${this.isTesting}">
              ${this.isTesting ? this.t.testing : this.t.testRun}
            </button>
            <button class="btn btn-info" @click="${this.dryRunAutomation}" ?disabled="${this.isSimulating}">
              ${this.isSimulating ? this.t.simulating : this.t.dryRun}
            </button>
          </div>
          <div class="templates">
            <span class="templates-label">${this.t.templates}</span>
            <button class="template-btn" @click="${() => this.setTemplate(this.t.templatePrompts.template1)}">
              ${this.t.template1}
            </button>
            <button class="template-btn" @click="${() => this.setTemplate(this.t.templatePrompts.template2)}">
              ${this.t.template2}
            </button>
            <button class="template-btn" @click="${() => this.setTemplate(this.t.templatePrompts.template3)}">
              ${this.t.template3}
            </button>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn ${this.currentTab === 'flow' ? 'active' : ''}" @click="${() => this.switchTab('flow')}">
            ${this.t.tabs.flow}
          </button>
          <button class="tab-btn ${this.currentTab === 'yaml' ? 'active' : ''}" @click="${() => this.switchTab('yaml')}">
            ${this.t.tabs.yaml}
          </button>
          <button class="tab-btn ${this.currentTab === 'validate' ? 'active' : ''}" @click="${() => this.switchTab('validate')}">
            ${this.t.tabs.validate}
          </button>
          <button class="tab-btn ${this.currentTab === 'preview' ? 'active' : ''}" @click="${() => this.switchTab('preview')}">
            ${this.t.tabs.preview}
          </button>
          <button class="tab-btn ${this.currentTab === 'test' ? 'active' : ''}" @click="${() => this.switchTab('test')}">
            ${this.t.tabs.test}
          </button>
        </div>

        ${this.currentTab === 'flow' ? html`
          <div class="flow-diagram">
            <div class="flow-node">🔍 Input</div>
            <div class="flow-arrow">↓</div>
            <div class="flow-node">🤖 AI Process</div>
            <div class="flow-arrow">↓</div>
            <div class="flow-node">✅ Validation</div>
            <div class="flow-arrow">↓</div>
            <div class="flow-node">💾 Save</div>
          </div>
        ` : ''}

        ${this.currentTab === 'yaml' ? html`
          <pre class="yaml-output">${this.yamlOutput || 'Genera un\'automazione per vedere il YAML...'}</pre>
        ` : ''}

        ${this.currentTab === 'validate' ? html`
          <div class="validation-section">
            ${this.validationResult ? html`
              ${this.validationResult.valid ? html`
                <div class="valid-message">✅ ${this.t.validYaml}</div>
              ` : html`
                <div class="error-message">${this.t.invalidYaml}\n${this.validationResult.error}</div>
              `}
            ` : html`
              <p>Valida il YAML per vedere i risultati...</p>
            `}
          </div>
        ` : ''}

        ${this.currentTab === 'preview' ? html`
          <div class="preview-section">
            ${this.previewResult ? html`
              <div class="preview-content">
                <h3>📋 ${this.previewResult.alias}</h3>
                ${this.previewResult.description ? html`<p class="description">${this.previewResult.description}</p>` : ''}
                
                ${this.previewResult.warnings.length > 0 ? html`
                  <div class="warnings">
                    <h4>⚠️ ${this.t.warnings}:</h4>
                    ${this.previewResult.warnings.map(warning => html`<div class="warning-item">${warning}</div>`)}
                  </div>
                ` : ''}

                <div class="preview-section-item">
                  <h4>🔥 ${this.t.triggers} (${this.previewResult.triggers.length}):</h4>
                  ${this.previewResult.triggers.map(trigger => html`
                    <div class="preview-item ${trigger.valid ? 'valid' : 'invalid'}">
                      <span class="type-badge">${trigger.type}</span>
                      <span class="description">${trigger.description}</span>
                      ${!trigger.valid ? html`
                        <span class="error">❌ ${trigger.error}</span>
                        ${trigger.entity_id ? html`
                          <button class="btn-replace-entity" @click="${() => this.openEntityPicker(trigger.entity_id)}">
                            ${this.t.replaceEntity}
                          </button>
                        ` : ''}
                      ` : ''}
                    </div>
                  `)}
                </div>

                ${this.previewResult.conditions.length > 0 ? html`
                  <div class="preview-section-item">
                    <h4>🔍 ${this.t.conditions} (${this.previewResult.conditions.length}):</h4>
                    ${this.previewResult.conditions.map(condition => html`
                      <div class="preview-item ${condition.valid ? 'valid' : 'invalid'}">
                        <span class="type-badge">${condition.type}</span>
                        <span class="description">${condition.description}</span>
                        ${!condition.valid ? html`
                          <span class="error">❌ ${condition.error}</span>
                          ${condition.entity_id ? html`
                            <button class="btn-replace-entity" @click="${() => this.openEntityPicker(condition.entity_id)}">
                              ${this.t.replaceEntity}
                            </button>
                          ` : ''}
                        ` : ''}
                      </div>
                    `)}
                  </div>
                ` : ''}

                <div class="preview-section-item">
                  <h4>⚡ ${this.t.actions} (${this.previewResult.actions.length}):</h4>
                  ${this.previewResult.actions.map(action => html`
                    <div class="preview-item ${action.valid ? 'valid' : 'invalid'}">
                      <span class="type-badge">${action.action}</span>
                      <span class="description">${action.description}</span>
                      ${!action.valid ? html`
                        <span class="error">❌ ${action.error}</span>
                        ${action.entity_id ? html`
                          <button class="btn-replace-entity" @click="${() => this.openEntityPicker(action.entity_id)}">
                            ${this.t.replaceEntity}
                          </button>
                        ` : ''}
                      ` : ''}
                    </div>
                  `)}
                </div>

                ${this.previewResult.entities_involved.length > 0 ? html`
                  <div class="preview-section-item">
                    <h4>🏠 ${this.t.entitiesInvolved} (${this.previewResult.entities_involved.length}):</h4>
                    <div class="entities-list">
                      ${this.previewResult.entities_involved.map(entity => html`
                        <span class="entity-badge">${entity}</span>
                      `)}
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : html`
              <p>${this.t.clickPreview}</p>
            `}
          </div>
        ` : ''}

        ${this.currentTab === 'test' ? html`
          <div class="test-section">
            ${this.testResult ? html`
              <div class="test-results">
                <h3>🧪 ${this.t.testResults}</h3>
                <div class="test-summary ${this.testResult.success ? 'success' : 'error'}">
                  ${this.testResult.success ? `✅ ${this.t.testSuccess}` : `❌ ${this.t.testFailed}`}
                  ${this.testResult.execution_time ? html`<span class="time"> (${this.testResult.execution_time}s)</span>` : ''}
                </div>

                ${this.testResult.executed_actions.length > 0 ? html`
                  <div class="executed-actions">
                    <h4>✅ ${this.t.executedActions}:</h4>
                    ${this.testResult.executed_actions.map(action => html`
                      <div class="action-result success">
                        <span class="action-name">${action.action}</span>
                        <span class="result">${action.result}</span>
                      </div>
                    `)}
                  </div>
                ` : ''}

                ${this.testResult.errors.length > 0 ? html`
                  <div class="test-errors">
                    <h4>❌ ${this.t.errors}:</h4>
                    ${this.testResult.errors.map(error => html`
                      <div class="action-result error">
                        <span class="action-name">${error.action || this.t.general}</span>
                        <span class="error-msg">${error.error}</span>
                      </div>
                    `)}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${this.dryRunResult ? html`
              <div class="dry-run-results">
                <h3>🔍 ${this.t.simulationResults}</h3>
                
                <div class="simulation-summary">
                  <h4>📋 ${this.t.wouldExecuteActions}:</h4>
                  ${this.dryRunResult.would_execute.map(action => html`
                    <div class="simulation-item">
                      <span class="action-name">${action.action}</span>
                      <span class="description">${action.description}</span>
                      ${action.entity_id ? html`
                        <div class="state-change">
                          <span class="entity">${action.entity_id}</span>
                          ${action.current_state ? html`
                            <span class="state-transition">
                              ${action.current_state} → ${action.predicted_state || '?'}
                            </span>
                          ` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `)}
                </div>

                ${Object.keys(this.dryRunResult.current_states).length > 0 ? html`
                  <div class="states-comparison">
                    <h4>🔄 ${this.t.predictedStateChanges}:</h4>
                    ${Object.entries(this.dryRunResult.current_states).map(([entity, currentState]) => html`
                      <div class="state-comparison">
                        <span class="entity">${entity}</span>
                        <span class="state-change">
                          ${currentState} → ${this.dryRunResult.predicted_states[entity] || '?'}
                        </span>
                      </div>
                    `)}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${!this.testResult && !this.dryRunResult ? html`
              <div class="test-instructions">
                <h4>🧪 Modalità Test</h4>
                <p><strong>Test Esecuzione:</strong> ${this.t.testDesc}</p>
                <p><strong>Simulazione:</strong> ${this.t.dryRunDesc}</p>
                <div class="test-buttons">
                  <button class="btn btn-warning" @click="${this.testAutomation}" ?disabled="${this.isTesting}">
                    ${this.isTesting ? this.t.testing : this.t.testRun}
                  </button>
                  <button class="btn btn-info" @click="${this.dryRunAutomation}" ?disabled="${this.isSimulating}">
                    ${this.isSimulating ? this.t.simulating : this.t.dryRun}
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      ${this.showEntityPicker ? html`
        <div class="entity-picker-overlay" @click="${this.closeEntityPicker}">
          <div class="entity-picker-modal" @click="${(e) => e.stopPropagation()}">
            <div class="entity-picker-header">
              <h3>${this.t.selectEntity}</h3>
              <button class="close-btn" @click="${this.closeEntityPicker}">✕</button>
            </div>
            
            <div class="entity-picker-body">
              <div class="entity-search">
                <input 
                  type="text" 
                  placeholder="${this.t.searchEntity}"
                  .value="${this.entitySearchQuery}"
                  @input="${(e) => this.searchEntities(e.target.value)}"
                  autofocus
                />
              </div>

              ${this.selectedEntityForReplacement ? html`
                <div class="current-entity">
                  <strong>${this.t.entityNotFound}:</strong>
                  <code>${this.selectedEntityForReplacement}</code>
                </div>
              ` : ''}

              ${this.entitySuggestions.length > 0 ? html`
                <div class="entity-suggestions">
                  <h4>${this.entitySearchQuery ? this.t.searchEntity : this.t.suggestedEntities}</h4>
                  <div class="entity-list">
                    ${this.entitySuggestions.map(entity => html`
                      <div class="entity-item" @click="${() => this.replaceEntity(this.selectedEntityForReplacement, entity.id)}">
                        <div class="entity-icon">
                          ${this.getEntityIcon(entity.domain)}
                        </div>
                        <div class="entity-info">
                          <div class="entity-name">${entity.friendly_name}</div>
                          <div class="entity-id">${entity.id}</div>
                          <div class="entity-state">${entity.state}</div>
                        </div>
                      </div>
                    `)}
                  </div>
                </div>
              ` : html`
                <div class="no-entities">
                  ${this.t.noEntitiesFound}
                </div>
              `}
            </div>

            <div class="entity-picker-footer">
              <button class="btn btn-secondary" @click="${this.closeEntityPicker}">
                ${this.t.cancel}
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  getEntityIcon(domain) {
    const icons = {
      light: '💡',
      switch: '🔌',
      sensor: '📊',
      binary_sensor: '🔘',
      climate: '🌡️',
      cover: '🪟',
      fan: '🌀',
      lock: '🔒',
      media_player: '📺',
      camera: '📷',
      alarm_control_panel: '🚨',
      automation: '🤖',
      script: '📜',
      scene: '🎬',
      person: '👤',
      device_tracker: '📍',
      weather: '🌤️',
      sun: '☀️',
      input_boolean: '🔘',
      input_number: '🔢',
      input_select: '📋',
      input_text: '📝',
      timer: '⏲️',
      counter: '🔢'
    };
    return icons[domain] || '🏠';
  }

  static get styles() {
    return css`
      :host {
        --primary-color: #03dac6;
        --primary-dark: #018786;
        --accent-color: #cf6679;
        --bg-color: #121212;
        --surface-color: #1e1e1e;
        --text-color: #e1e1e1;
        --text-secondary: #b3b3b3;
        display: block;
        background-color: var(--bg-color);
        color: var(--text-color);
        height: 100vh;
        overflow: hidden;
        position: relative;
      }

      .header-bar {
        display: flex;
        align-items: center;
        padding: 14px 20px;
        background: var(--surface-color);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: sticky;
        top: 0;
        z-index: 100;
        gap: 12px;
      }

      @media (max-width: 768px) {
        .header-bar {
          padding: 10px 12px;
          gap: 8px;
        }
      }

      .menu-button {
        display: none;
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .menu-button:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      @media (max-width: 768px) {
        .menu-button {
          display: block;
        }
      }

      .header-bar h1 {
        margin: 0;
        font-size: 22px;
        flex: 1;
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      @media (max-width: 768px) {
        .header-bar h1 {
          font-size: 16px;
        }
      }

      .status {
        padding: 6px 14px;
        border-radius: 20px;
        background: #2e7d32;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .status {
          font-size: 10px;
          padding: 4px 10px;
        }
      }

      .container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
        height: calc(100vh - 73px);
        overflow-y: auto;
      }

      @media (max-width: 768px) {
        .container {
          padding: 12px;
          height: calc(100vh - 65px);
        }
      }

      .input-section {
        background: var(--surface-color);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 768px) {
        .input-section {
          padding: 16px;
          margin-bottom: 16px;
          border-radius: 12px;
        }
      }

      .input-section textarea {
        width: 100%;
        height: 100px;
        background: var(--bg-color);
        border: 2px solid rgba(3, 218, 198, 0.3);
        border-radius: 12px;
        padding: 12px;
        color: var(--text-color);
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        resize: vertical;
        margin-bottom: 12px;
        box-sizing: border-box;
        transition: border-color 0.3s, box-shadow 0.3s;
      }

      .input-section textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 4px rgba(3, 218, 198, 0.2);
      }

      @media (max-width: 768px) {
        .input-section textarea {
          height: 80px;
          font-size: 13px;
          padding: 10px;
        }
      }

      .button-group {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
      }

      .secondary-buttons {
        grid-template-columns: 1fr 1fr 1fr;
        margin-bottom: 12px;
      }

      @media (max-width: 768px) {
        .button-group {
          grid-template-columns: 1fr;
          gap: 8px;
        }
        
        .secondary-buttons {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }

      @media (min-width: 769px) and (max-width: 1024px) {
        .button-group {
          grid-template-columns: 1fr 1fr;
        }
        
        .secondary-buttons {
          grid-template-columns: 1fr 1fr;
        }
      }

      .btn {
        padding: 12px 20px;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .btn {
          padding: 10px 16px;
          font-size: 14px;
        }
      }

      .btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }

      .btn:hover::before {
        width: 300px;
        height: 300px;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        color: #000;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(3, 218, 198, 0.4);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-color);
        backdrop-filter: blur(10px);
      }

      .btn-secondary:hover:not(:disabled) {
        background: rgba(207, 102, 121, 0.3);
        transform: translateY(-2px);
      }

      .btn-info {
        background: rgba(33, 150, 243, 0.2);
        color: #2196f3;
        backdrop-filter: blur(10px);
      }

      .btn-info:hover:not(:disabled) {
        background: rgba(33, 150, 243, 0.4);
        transform: translateY(-2px);
      }

      .btn-warning {
        background: rgba(255, 152, 0, 0.2);
        color: #ff9800;
        backdrop-filter: blur(10px);
      }

      .btn-warning:hover:not(:disabled) {
        background: rgba(255, 152, 0, 0.4);
        transform: translateY(-2px);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .templates {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .templates-label {
        font-size: 11px;
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        width: 100%;
        margin-bottom: 4px;
      }

      .template-btn {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-color);
        border: 1px solid rgba(3, 218, 198, 0.3);
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .template-btn:hover {
        background: rgba(3, 218, 198, 0.2);
        border-color: var(--primary-color);
        transform: translateY(-1px);
      }

      @media (max-width: 768px) {
        .templates {
          gap: 6px;
          padding-top: 6px;
        }

        .templates-label {
          font-size: 10px;
          margin-bottom: 2px;
        }

        .template-btn {
          padding: 5px 10px;
          font-size: 10px;
          flex: 1 1 auto;
          min-width: 0;
          text-align: center;
        }
      }

      .tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 20px;
        border-radius: 12px;
        padding: 4px;
        background: var(--surface-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab-btn {
        flex: 1;
        min-width: fit-content;
        padding: 10px 12px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
      }

      .tab-btn.active {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        color: #000;
        box-shadow: 0 4px 12px rgba(3, 218, 198, 0.3);
      }

      @media (max-width: 768px) {
        .tabs {
          gap: 4px;
          padding: 3px;
          margin-bottom: 16px;
        }

        .tab-btn {
          padding: 8px 10px;
          font-size: 12px;
          min-width: 80px;
        }
      }

      .flow-diagram {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 24px;
        background: linear-gradient(135deg, var(--surface-color), rgba(30, 30, 30, 0.8));
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 768px) {
        .flow-diagram {
          padding: 16px;
          gap: 10px;
        }
      }

      .flow-node {
        padding: 20px;
        text-align: center;
        border-radius: 12px;
        background: rgba(3, 218, 198, 0.1);
        border: 2px solid rgba(3, 218, 198, 0.3);
        font-weight: 600;
        transition: all 0.3s;
        font-size: 15px;
      }

      @media (max-width: 768px) {
        .flow-node {
          padding: 14px;
          font-size: 13px;
        }
      }

      .flow-node:hover {
        background: rgba(3, 218, 198, 0.2);
        transform: scale(1.05);
      }

      .flow-arrow {
        text-align: center;
        font-size: 20px;
        color: var(--primary-color);
      }

      @media (max-width: 768px) {
        .flow-arrow {
          font-size: 18px;
        }
      }

      .yaml-output {
        background: var(--bg-color);
        border: 2px solid rgba(3, 218, 198, 0.3);
        border-radius: 12px;
        padding: 16px;
        font-family: 'Roboto Mono', monospace;
        white-space: pre-wrap;
        max-height: 500px;
        overflow-y: auto;
        margin: 0;
        color: var(--primary-color);
        line-height: 1.6;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .yaml-output {
          padding: 12px;
          font-size: 11px;
          max-height: 400px;
          line-height: 1.5;
        }
      }

      .validation-section {
        padding: 20px;
        border-radius: 12px;
        background: var(--surface-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 768px) {
        .validation-section {
          padding: 16px;
        }
      }

      .valid-message {
        color: #4caf50;
        padding: 16px;
        background: rgba(76, 175, 80, 0.1);
        border-radius: 12px;
        border-left: 4px solid #4caf50;
        font-weight: 600;
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .valid-message {
          padding: 12px;
          font-size: 13px;
        }
      }

      .error-message {
        color: #f44336;
        padding: 16px;
        background: rgba(244, 67, 54, 0.1);
        border-radius: 12px;
        border-left: 4px solid #f44336;
        font-family: 'Roboto Mono', monospace;
        white-space: pre-wrap;
        font-size: 13px;
        word-break: break-word;
      }

      @media (max-width: 768px) {
        .error-message {
          padding: 12px;
          font-size: 11px;
        }
      }

      @media (max-width: 768px) {
        .container {
          padding: 16px;
        }
        
        .header-bar {
          padding: 12px 16px;
        }
        
        .header-bar h1 {
          font-size: 18px;
        }
        
        .flow-diagram {
          padding: 16px;
        }
        
        .status {
          font-size: 10px;
          padding: 4px 12px;
        }
      }

      /* Preview Section Styles */
      .preview-section {
        padding: 20px;
        border-radius: 12px;
        background: var(--surface-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 768px) {
        .preview-section {
          padding: 16px;
        }
      }

      .preview-content h3 {
        margin: 0 0 16px 0;
        color: var(--primary-color);
        font-size: 18px;
      }

      @media (max-width: 768px) {
        .preview-content h3 {
          font-size: 16px;
          margin-bottom: 12px;
        }
      }

      .description {
        color: var(--text-secondary);
        margin-bottom: 20px;
        font-style: italic;
      }

      .warnings {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.3);
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 16px;
      }

      @media (max-width: 768px) {
        .warnings {
          padding: 10px;
          margin-bottom: 12px;
        }
      }

      .description {
        color: var(--text-secondary);
        margin-bottom: 16px;
        font-style: italic;
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .description {
          font-size: 12px;
          margin-bottom: 12px;
        }
      }

      .warnings h4 {
        margin: 0 0 8px 0;
        color: #ff9800;
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .warnings h4 {
          font-size: 12px;
          margin-bottom: 6px;
        }
      }

      .warning-item {
        color: #ff9800;
        margin: 4px 0;
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .warning-item {
          font-size: 11px;
          margin: 3px 0;
        }
      }

      .preview-section-item {
        margin-bottom: 20px;
      }

      @media (max-width: 768px) {
        .preview-section-item {
          margin-bottom: 16px;
        }
      }

      .preview-section-item h4 {
        margin: 0 0 12px 0;
        color: var(--text-color);
        font-size: 15px;
      }

      @media (max-width: 768px) {
        .preview-section-item h4 {
          font-size: 14px;
          margin-bottom: 10px;
        }
      }

      .preview-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        margin: 6px 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-left: 4px solid transparent;
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .preview-item {
          gap: 8px;
          padding: 8px;
          margin: 4px 0;
        }
      }

      .preview-item.valid {
        border-left-color: #4caf50;
      }

      .preview-item.invalid {
        border-left-color: #f44336;
        background: rgba(244, 67, 54, 0.1);
      }

      .type-badge {
        background: var(--primary-color);
        color: #000;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        min-width: 60px;
        text-align: center;
      }

      @media (max-width: 768px) {
        .type-badge {
          font-size: 10px;
          padding: 3px 6px;
          min-width: 50px;
        }
      }

      .preview-item .description {
        flex: 1;
        margin: 0;
        color: var(--text-color);
        font-size: 14px;
        min-width: 0;
        word-break: break-word;
      }

      @media (max-width: 768px) {
        .preview-item .description {
          font-size: 12px;
          width: 100%;
        }
      }

      .preview-item .error {
        color: #f44336;
        font-size: 12px;
      }

      .entities-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .entity-badge {
        background: rgba(3, 218, 198, 0.2);
        color: var(--primary-color);
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 11px;
        border: 1px solid rgba(3, 218, 198, 0.3);
      }

      @media (max-width: 768px) {
        .entity-badge {
          font-size: 10px;
          padding: 3px 10px;
        }
      }

      /* Test Section Styles */
      .test-section {
        padding: 20px;
        border-radius: 12px;
        background: var(--surface-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 768px) {
        .test-section {
          padding: 16px;
        }
      }

      .test-results h3,
      .dry-run-results h3 {
        margin: 0 0 16px 0;
        color: var(--primary-color);
        font-size: 18px;
      }

      @media (max-width: 768px) {
        .test-results h3,
        .dry-run-results h3 {
          font-size: 16px;
          margin-bottom: 12px;
        }
      }

      .test-summary {
        padding: 14px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-weight: 600;
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .test-summary {
          padding: 10px;
          margin-bottom: 12px;
          font-size: 12px;
        }
      }

      .test-summary.success {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
        color: #4caf50;
      }

      .test-summary.error {
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
        color: #f44336;
      }

      .time {
        color: var(--text-secondary);
        font-weight: normal;
      }

      .executed-actions,
      .test-errors {
        margin-bottom: 16px;
      }

      @media (max-width: 768px) {
        .executed-actions,
        .test-errors {
          margin-bottom: 12px;
        }
      }

      .executed-actions h4,
      .test-errors h4 {
        margin: 0 0 10px 0;
        color: var(--text-color);
        font-size: 15px;
      }

      @media (max-width: 768px) {
        .executed-actions h4,
        .test-errors h4 {
          font-size: 13px;
          margin-bottom: 8px;
        }
      }

      .action-result {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        margin: 6px 0;
        border-radius: 8px;
        border-left: 4px solid transparent;
        gap: 8px;
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .action-result {
          flex-direction: column;
          align-items: flex-start;
          padding: 8px;
          margin: 4px 0;
        }
      }

      .action-result.success {
        background: rgba(76, 175, 80, 0.1);
        border-left-color: #4caf50;
      }

      .action-result.error {
        background: rgba(244, 67, 54, 0.1);
        border-left-color: #f44336;
      }

      .action-name {
        font-weight: 600;
        color: var(--text-color);
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .action-name {
          font-size: 12px;
        }
      }

      .result {
        color: #4caf50;
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .result {
          font-size: 11px;
        }
      }

      .error-msg {
        color: #f44336;
        font-size: 13px;
        word-break: break-word;
      }

      @media (max-width: 768px) {
        .error-msg {
          font-size: 11px;
        }
      }

      .simulation-item {
        padding: 14px;
        margin: 10px 0;
        border-radius: 8px;
        background: rgba(33, 150, 243, 0.1);
        border-left: 4px solid #2196f3;
      }

      @media (max-width: 768px) {
        .simulation-item {
          padding: 10px;
          margin: 8px 0;
        }
      }

      .simulation-item .action-name {
        display: block;
        margin-bottom: 8px;
        color: #2196f3;
        font-weight: 600;
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .simulation-item .action-name {
          font-size: 12px;
          margin-bottom: 6px;
        }
      }

      .simulation-item .description {
        display: block;
        margin-bottom: 8px;
        color: var(--text-color);
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .simulation-item .description {
          font-size: 11px;
          margin-bottom: 6px;
        }
      }

      .state-change {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .state-change {
          font-size: 10px;
          gap: 6px;
        }
      }

      .entity {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 8px;
        border-radius: 12px;
        color: var(--text-secondary);
        font-size: 11px;
      }

      @media (max-width: 768px) {
        .entity {
          font-size: 10px;
          padding: 2px 6px;
        }
      }

      .state-transition {
        color: var(--primary-color);
        font-weight: 600;
        font-size: 11px;
      }

      @media (max-width: 768px) {
        .state-transition {
          font-size: 10px;
        }
      }

      .states-comparison {
        margin-top: 16px;
      }

      @media (max-width: 768px) {
        .states-comparison {
          margin-top: 12px;
        }
      }

      .states-comparison h4,
      .simulation-summary h4 {
        margin: 0 0 10px 0;
        color: var(--text-color);
        font-size: 15px;
      }

      @media (max-width: 768px) {
        .states-comparison h4,
        .simulation-summary h4 {
          font-size: 13px;
          margin-bottom: 8px;
        }
      }

      .state-comparison {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        margin: 4px 0;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        gap: 8px;
      }

      @media (max-width: 768px) {
        .state-comparison {
          flex-direction: column;
          align-items: flex-start;
          padding: 6px 10px;
          gap: 4px;
        }
      }

      .test-instructions {
        text-align: center;
        padding: 30px 20px;
      }

      @media (max-width: 768px) {
        .test-instructions {
          padding: 20px 16px;
        }
      }

      .test-instructions h4 {
        margin-bottom: 16px;
        color: var(--primary-color);
        font-size: 16px;
      }

      @media (max-width: 768px) {
        .test-instructions h4 {
          font-size: 14px;
          margin-bottom: 12px;
        }
      }

      .test-instructions p {
        margin: 10px 0;
        color: var(--text-secondary);
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .test-instructions p {
          font-size: 12px;
          margin: 8px 0;
        }
      }

      .test-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .test-buttons {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }

        .test-buttons .btn {
          width: 100%;
        }
      }

      /* Entity Picker Modal Styles */
      .entity-picker-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      }

      .entity-picker-modal {
        background: var(--surface-color);
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .entity-picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .entity-picker-header h3 {
        margin: 0;
        color: var(--primary-color);
        font-size: 18px;
      }

      .close-btn {
        background: none;
        border: none;
        color: var(--text-color);
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .entity-picker-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .entity-search input {
        width: 100%;
        padding: 12px 16px;
        background: var(--bg-color);
        border: 2px solid rgba(3, 218, 198, 0.3);
        border-radius: 12px;
        color: var(--text-color);
        font-size: 14px;
        box-sizing: border-box;
        transition: border-color 0.3s;
      }

      .entity-search input:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .current-entity {
        margin: 16px 0;
        padding: 12px;
        background: rgba(244, 67, 54, 0.1);
        border-left: 4px solid #f44336;
        border-radius: 8px;
        font-size: 13px;
      }

      .current-entity code {
        background: rgba(0, 0, 0, 0.3);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Roboto Mono', monospace;
        color: var(--primary-color);
      }

      .entity-suggestions {
        margin-top: 16px;
      }

      .entity-suggestions h4 {
        margin: 0 0 12px 0;
        color: var(--text-secondary);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .entity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .entity-item:hover {
        background: rgba(3, 218, 198, 0.1);
        border-color: var(--primary-color);
        transform: translateX(4px);
      }

      .entity-icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(3, 218, 198, 0.1);
        border-radius: 10px;
      }

      .entity-info {
        flex: 1;
        min-width: 0;
      }

      .entity-name {
        font-weight: 600;
        color: var(--text-color);
        font-size: 14px;
        margin-bottom: 4px;
      }

      .entity-id {
        font-size: 12px;
        color: var(--text-secondary);
        font-family: 'Roboto Mono', monospace;
        margin-bottom: 2px;
      }

      .entity-state {
        font-size: 11px;
        color: var(--primary-color);
        font-weight: 600;
      }

      .no-entities {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
        font-size: 14px;
      }

      .entity-picker-footer {
        padding: 16px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: flex-end;
      }

      .btn-replace-entity {
        background: rgba(33, 150, 243, 0.2);
        color: #2196f3;
        border: 1px solid rgba(33, 150, 243, 0.3);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        margin-left: 8px;
      }

      .btn-replace-entity:hover {
        background: rgba(33, 150, 243, 0.4);
        transform: translateY(-1px);
      }

      @media (max-width: 768px) {
        .entity-picker-modal {
          width: 95%;
          max-height: 90vh;
        }

        .entity-picker-header {
          padding: 16px;
        }

        .entity-picker-header h3 {
          font-size: 16px;
        }

        .entity-picker-body {
          padding: 16px;
        }

        .entity-item {
          padding: 10px;
          gap: 10px;
        }

        .entity-icon {
          font-size: 20px;
          width: 36px;
          height: 36px;
        }

        .entity-name {
          font-size: 13px;
        }

        .entity-id {
          font-size: 11px;
        }

        .btn-replace-entity {
          font-size: 10px;
          padding: 3px 8px;
        }
      }
    `;
  }
}

customElements.define('ai-automation-builder-panel', AIAutomationBuilderPanel);