import React, { memo, useState } from 'react';
import { FileText, ChevronRight, ChevronDown, Code, Braces, Package, Square } from 'lucide-react';

/*
Abstract Syntax Tree Display Component

Displays the Abstract Syntax Tree visualization for parsed source code with interactive tree navigation and node details.
Depends on React, lucide-react icons.
*/

const AbstractSyntaxTree = memo(function AbstractSyntaxTree({ ast }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);

  if (!ast) {
    return (
      <div className="w-full p-4 flex justify-center items-start">
        <div className="w-full flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
          <div className="text-center px-4">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-base text-gray-500 dark:text-gray-400 mb-2 font-semibold">
              No AST available
            </p>
            <p className="text-sm text-gray-400">
              Abstract Syntax Tree will be displayed here after successful syntax analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

/*
Safely convert any value to string for React rendering

@param {any} value - The value to convert
@returns {String} String representation
*/
const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      // Handle AST nodes and tokens
      if (value.token) return value.token.lexeme || '';
      if (value.lexeme) return value.lexeme;
      if (value.type && typeof value.type === 'string') return value.type;
      return '[Object]';
    }
    return String(value);
  };

/*
Safely convert value to display string with quotes for strings

@param {any} value - The value to convert
@returns {String} Display string with quotes for string values
*/
const safeToDisplayString = (value) => {
    if (typeof value === 'string') return `"${value}"`;
    return safeToString(value);
  };

/*
Toggle node expansion in the AST tree

@param {String} nodeId - Unique identifier for the node
*/
const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

/*
Get node icon based on AST node type

@param {String} nodeType - The AST node type
@returns {React.Component} Icon component with appropriate color
*/
const getNodeIcon = (nodeType) => {
    const iconProps = { size: 16, className: "text-gray-500 dark:text-gray-400" };
    
    switch (nodeType) {
      case 'ECHO_PROGRAM':
        return <Package {...iconProps} className="text-blue-500 dark:text-blue-400" />;
      case 'FUNCTION_DEF':
        return <Code {...iconProps} className="text-purple-500 dark:text-purple-400" />;
      case 'DECLARATION_STMT':
        return <Code {...iconProps} className="text-green-500 dark:text-green-400" />;
      case 'ASSIGNMENT_STMT':
        return <Code {...iconProps} className="text-orange-500 dark:text-orange-400" />;
      case 'INPUT_STMT':
        return <Code {...iconProps} className="text-indigo-500 dark:text-indigo-400" />;
      case 'OUTPUT_STMT':
        return <Code {...iconProps} className="text-cyan-500 dark:text-cyan-400" />;
      case 'IF_STMT':
      case 'IF_ELSE_STMT':
      case 'IF_ELSEIF_ELSE_STMT':
      case 'NESTED_IF_STMT':
      case 'SWITCH_STMT':
        return <Braces {...iconProps} className="text-red-500 dark:text-red-400" />;
      case 'CASE_BLOCK':
        return <Square {...iconProps} className="text-red-400 dark:text-red-300" />;
      case 'DEFAULT_BLOCK':
        return <Square {...iconProps} className="text-red-300 dark:text-red-200" />;
      case 'FOR_LOOP':
      case 'WHILE_LOOP':
      case 'DO_WHILE_LOOP':
        return <Braces {...iconProps} className="text-cyan-500 dark:text-cyan-400" />;
      case 'JUMP_STMT':
        return <Code {...iconProps} className="text-yellow-500 dark:text-yellow-400" />;
      case 'LIST_LIT':
        return <Square {...iconProps} className="text-indigo-500 dark:text-indigo-400" />;
      case 'ARRAY_ELEMENTS':
        return <Square {...iconProps} className="text-indigo-400 dark:text-indigo-300" />;
      case 'STRING_INSERTION':
        return <Code {...iconProps} className="text-pink-500 dark:text-pink-400" />;
      case 'STRING_CONTENT':
        return <Code {...iconProps} className="text-orange-400 dark:text-orange-300" />;
      case 'FIELD_ACCESS':
      case 'MEMBER_ACCESS':
        return <Code {...iconProps} className="text-teal-500 dark:text-teal-400" />;
      case 'DATA_STRUCT':
        return <Package {...iconProps} className="text-emerald-500 dark:text-emerald-400" />;
      case 'FIELD_DECL':
        return <Code {...iconProps} className="text-emerald-400 dark:text-emerald-300" />;
      case 'IDENTIFIER':
        return <Code {...iconProps} className="text-yellow-500 dark:text-yellow-400" />;
      case 'LITERAL':
      case 'NUMBER_LIT':
      case 'DECIMAL_LIT':
      case 'BOOL_LIT':
      case 'NULL_LITERAL':
        return <Square {...iconProps} className="text-blue-400 dark:text-blue-300" />;
      case 'STRING_LIT':
        return <Code {...iconProps} className="text-green-400 dark:text-green-300" />;
      case 'INPUT_EXPRESSION':
        return <Code {...iconProps} className="text-indigo-400 dark:text-indigo-300" />;
      case 'NOISE_WORD':
        return <Code {...iconProps} className="text-gray-400 dark:text-gray-500" />;
      default:
        if (nodeType.includes('EXPR') || nodeType.includes('OP_')) {
          return <Code {...iconProps} className="text-pink-500 dark:text-pink-400" />;
        }
        return <FileText {...iconProps} />;
    }
  };

/*
Get node color based on AST node type

@param {String} nodeType - The AST node type
@returns {String} CSS color class
*/
const getNodeColor = (nodeType) => {
    const colors = {
      'ECHO_PROGRAM': 'text-blue-600 dark:text-blue-400',
      'FUNCTION_DEF': 'text-purple-600 dark:text-purple-400',
      'DECLARATION_STMT': 'text-green-600 dark:text-green-400',
      'ASSIGNMENT_STMT': 'text-orange-600 dark:text-orange-400',
      'INPUT_STMT': 'text-indigo-600 dark:text-indigo-400',
      'OUTPUT_STMT': 'text-cyan-600 dark:text-cyan-400',
      'IF_STMT': 'text-red-600 dark:text-red-400',
      'IF_ELSE_STMT': 'text-red-600 dark:text-red-400',
      'IF_ELSEIF_ELSE_STMT': 'text-red-600 dark:text-red-400',
      'NESTED_IF_STMT': 'text-red-600 dark:text-red-400',
      'SWITCH_STMT': 'text-red-600 dark:text-red-400',
      'CASE_BLOCK': 'text-red-500 dark:text-red-300',
      'DEFAULT_BLOCK': 'text-red-400 dark:text-red-200',
      'FOR_LOOP': 'text-cyan-600 dark:text-cyan-400',
      'WHILE_LOOP': 'text-cyan-600 dark:text-cyan-400',
      'DO_WHILE_LOOP': 'text-cyan-600 dark:text-cyan-400',
      'JUMP_STMT': 'text-yellow-600 dark:text-yellow-400',
      'LIST_LIT': 'text-indigo-600 dark:text-indigo-400',
      'ARRAY_ELEMENTS': 'text-indigo-500 dark:text-indigo-300',
      'STRING_INSERTION': 'text-pink-600 dark:text-pink-400',
      'STRING_CONTENT': 'text-orange-500 dark:text-orange-300',
      'FIELD_ACCESS': 'text-teal-600 dark:text-teal-400',
      'MEMBER_ACCESS': 'text-teal-600 dark:text-teal-400',
      'DATA_STRUCT': 'text-emerald-600 dark:text-emerald-400',
      'FIELD_DECL': 'text-emerald-500 dark:text-emerald-300',
      'IDENTIFIER': 'text-yellow-600 dark:text-yellow-400',
      'LITERAL': 'text-blue-500 dark:text-blue-300',
      'NUMBER_LIT': 'text-blue-500 dark:text-blue-300',
      'DECIMAL_LIT': 'text-blue-500 dark:text-blue-300',
      'BOOL_LIT': 'text-blue-500 dark:text-blue-300',
      'NULL_LITERAL': 'text-blue-500 dark:text-blue-300',
      'STRING_LIT': 'text-green-500 dark:text-green-300',
      'INPUT_EXPRESSION': 'text-indigo-500 dark:text-indigo-300',
      'NOISE_WORD': 'text-gray-500 dark:text-gray-400',
    };

    if (nodeType.includes('EXPR') || nodeType.includes('OP_')) {
      return 'text-pink-600 dark:text-pink-400';
    }

    return colors[nodeType] || 'text-gray-600 dark:text-gray-400';
  };

/*
Generate unique node ID for tracking expansion state

@param {Object} node - The AST node
@param {String} path - Path in the tree
@returns {String} Unique node identifier
*/
const getNodeId = (node, path = '') => {
    if (!node || typeof node !== 'object') return `invalid_${Math.random()}`;
    return `${path}_${node.type || 'unknown'}_${node.name || ''}_${node.line || ''}`;
  };

/*
Check if node has children for expand/collapse functionality

@param {Object} node - The AST node to check
@returns {Boolean} True if node has children
*/
const hasChildren = (node) => {
    if (!node || typeof node !== 'object') return false;
    
    // Check if body is a STMT_LIST with statements
    const bodyHasStatements = node.body && 
      (node.body.statements && node.body.statements.length > 0);
    
    // Check if thenBody/elseBody/defaultBlock are STMT_LIST with statements
    const thenBodyHasStatements = node.thenBody && 
      (node.thenBody.statements && node.thenBody.statements.length > 0);
    const elseBodyHasStatements = node.elseBody && 
      (node.elseBody.statements && node.elseBody.statements.length > 0);
    const defaultBlockHasStatements = node.defaultBlock && 
      (node.defaultBlock.statements && node.defaultBlock.statements.length > 0);
    
    return (
      (node.children && node.children.length > 0) ||
      (node.statements && node.statements.statements && node.statements.statements.length > 0) ||
      (node.items && node.items.length > 0) ||
      (node.args && node.args.length > 0) ||
      (node.elements && node.elements.length > 0) ||
      (node.elseIfs && node.elseIfs.length > 0) ||
      (node.cases && node.cases.length > 0) ||
      (node.content && node.content.length > 0) ||
      (node.parameters && node.parameters.params && node.parameters.params.length > 0) ||
      (node.arguments && node.arguments.args && node.arguments.args.length > 0) ||
      (node.fields && node.fields.fields && node.fields.fields.length > 0) ||
      node.left ||
      node.right ||
      node.expression ||
      node.condition ||
      bodyHasStatements ||
      thenBodyHasStatements ||
      elseBodyHasStatements ||
      defaultBlockHasStatements ||
      node.object ||
      node.field ||
      node.identifier ||
      node.value ||
      node.dataType ||
      node.assignmentOp ||
      node.target ||
      node.keyword ||
      node.returnType ||
      node.returnStatement ||
      node.step ||
      node.parameters ||
      node.arguments
    );
  };

/*
Render tree node with expand/collapse functionality

@param {Object} node - The AST node to render
@param {Number} depth - Current depth in tree for indentation
@param {String} path - Path in the tree
@returns {React.Component} Rendered node component
*/
const renderNode = (node, depth = 0, path = '') => {
    if (!node || typeof node !== 'object' || !node.type) return null;

    const nodeId = getNodeId(node, path);
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildNodes = hasChildren(node);
    const isSelected = selectedNode === nodeId;

    return (
      <div key={nodeId} className="select-none">
        <div
          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded transition-colors ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (hasChildNodes) {
              toggleNode(nodeId);
            }
            setSelectedNode(nodeId);
          }}
        >
          {hasChildNodes && (
            <span className="text-gray-400 dark:text-gray-500">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          {!hasChildNodes && <span className="w-3.5" />}
          
          {getNodeIcon(node.type)}
          
          <span className={`font-mono text-sm font-medium ${getNodeColor(node.type)}`}>
            {safeToString(node.type)}
          </span>
          
          {node.name && (
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              "{safeToString(node.name)}"
            </span>
          )}
          
          {node.operator && (
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {safeToString(node.operator)}
            </span>
          )}
          
          {node.value !== undefined && (
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              = {safeToDisplayString(node.value)}
            </span>
          )}
          
          {node.token && (
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
              L{node.token.line || 0}:{node.token.column || 0}
            </span>
          )}
        </div>
        
        {isExpanded && hasChildNodes && (
          <div>
            {node.children && node.children.map((child, index) =>
              child && renderNode(child, depth + 1, `${path}.children.${index}`)
            )}
            
            {node.statements && node.statements.statements && node.statements.statements.map((stmt, index) =>
              stmt && renderNode(stmt, depth + 1, `${path}.statements.statements.${index}`)
            )}
            
            {node.items && node.items.map((item, index) =>
              item && renderNode(item, depth + 1, `${path}.items.${index}`)
            )}
            
            {node.args && node.args.map((arg, index) =>
              arg && renderNode(arg, depth + 1, `${path}.args.${index}`)
            )}
            
            {node.elements && node.elements.map((element, index) =>
              element && renderNode(element, depth + 1, `${path}.elements.${index}`)
            )}
            
            {node.elseIfs && node.elseIfs.map((elseIf, index) =>
              elseIf && renderNode(elseIf, depth + 1, `${path}.elseIfs.${index}`)
            )}
            
            {node.cases && node.cases.map((case_, index) =>
              case_ && renderNode(case_, depth + 1, `${path}.cases.${index}`)
            )}
            
            {node.content && node.content.map((contentItem, index) =>
              contentItem && renderNode(contentItem, depth + 1, `${path}.content.${index}`)
            )}
            
            {node.parameters && node.parameters.params && node.parameters.params.map((param, index) =>
              param && renderNode(param, depth + 1, `${path}.parameters.params.${index}`)
            )}
            
            {node.arguments && node.arguments.args && node.arguments.args.map((arg, index) =>
              arg && renderNode(arg, depth + 1, `${path}.arguments.args.${index}`)
            )}
            
            {node.fields && node.fields.fields && node.fields.fields.map((field, index) =>
              field && renderNode(field, depth + 1, `${path}.fields.fields.${index}`)
            )}
            
            {node.left && renderNode(node.left, depth + 1, `${path}.left`)}
            {node.right && renderNode(node.right, depth + 1, `${path}.right`)}
            {node.expression && renderNode(node.expression, depth + 1, `${path}.expression`)}
            {node.condition && renderNode(node.condition, depth + 1, `${path}.condition`)}
            
            {/* Render body - if it's a STMT_LIST, expand to show statements */}
            {node.body && (
              node.body.type === 'STMT_LIST' && node.body.statements ? (
                // If body is a STMT_LIST, render its statements directly
                node.body.statements.map((stmt, index) =>
                  renderNode(stmt, depth + 1, `${path}.body.statements.${index}`)
                )
              ) : (
                // Otherwise render the body node itself
                renderNode(node.body, depth + 1, `${path}.body`)
              )
            )}
            
            {/* Render thenBody - if it's a STMT_LIST, expand to show statements */}
            {node.thenBody && (
              node.thenBody.type === 'STMT_LIST' && node.thenBody.statements ? (
                node.thenBody.statements.map((stmt, index) =>
                  renderNode(stmt, depth + 1, `${path}.thenBody.statements.${index}`)
                )
              ) : (
                renderNode(node.thenBody, depth + 1, `${path}.thenBody`)
              )
            )}
            
            {/* Render elseBody - if it's a STMT_LIST, expand to show statements */}
            {node.elseBody && (
              node.elseBody.type === 'STMT_LIST' && node.elseBody.statements ? (
                node.elseBody.statements.map((stmt, index) =>
                  renderNode(stmt, depth + 1, `${path}.elseBody.statements.${index}`)
                )
              ) : (
                renderNode(node.elseBody, depth + 1, `${path}.elseBody`)
              )
            )}
            
            {/* Render defaultBlock - if it's a STMT_LIST, expand to show statements */}
            {node.defaultBlock && (
              node.defaultBlock.type === 'STMT_LIST' && node.defaultBlock.statements ? (
                node.defaultBlock.statements.map((stmt, index) =>
                  renderNode(stmt, depth + 1, `${path}.defaultBlock.statements.${index}`)
                )
              ) : (
                renderNode(node.defaultBlock, depth + 1, `${path}.defaultBlock`)
              )
            )}
            {node.object && renderNode(node.object, depth + 1, `${path}.object`)}
            {node.field && renderNode(node.field, depth + 1, `${path}.field`)}
            {node.identifier && renderNode(node.identifier, depth + 1, `${path}.identifier`)}
            {node.value && typeof node.value === 'object' && renderNode(node.value, depth + 1, `${path}.value`)}
            {node.dataType && renderNode(node.dataType, depth + 1, `${path}.dataType`)}
            {node.assignmentOp && renderNode(node.assignmentOp, depth + 1, `${path}.assignmentOp`)}
            {node.target && renderNode(node.target, depth + 1, `${path}.target`)}
            {node.keyword && renderNode(node.keyword, depth + 1, `${path}.keyword`)}
            {node.returnType && renderNode(node.returnType, depth + 1, `${path}.returnType`)}
            {node.returnStatement && renderNode(node.returnStatement, depth + 1, `${path}.returnStatement`)}
            {node.step && renderNode(node.step, depth + 1, `${path}.step`)}
          </div>
        )}
      </div>
    );
  };

/*
Get node details for selected node display

@returns {Object|null} Node details with path information
*/
const getNodeDetails = () => {
    if (!selectedNode) return null;
    
      // Find the selected node in the AST
      const findNode = (node, targetId, path = '') => {
      if (!node) return null;
      
      const nodeId = getNodeId(node, path);
      if (nodeId === targetId) return { node, path };
      
        // Search in children
        const searchInArray = (arr, prefix) => {
        if (!arr) return null;
        for (let i = 0; i < arr.length; i++) {
          const result = findNode(arr[i], targetId, `${path}.${prefix}.${i}`);
          if (result) return result;
        }
        return null;
      };
      
      return (
        searchInArray(node.children, 'children') ||
        (node.statements && searchInArray(node.statements.statements, 'statements.statements')) ||
        searchInArray(node.items, 'items') ||
        searchInArray(node.args, 'args') ||
        searchInArray(node.elements, 'elements') ||
        searchInArray(node.elseIfs, 'elseIfs') ||
        searchInArray(node.cases, 'cases') ||
        searchInArray(node.content, 'content') ||
        (node.parameters && searchInArray(node.parameters.params, 'parameters.params')) ||
        (node.arguments && searchInArray(node.arguments.args, 'arguments.args')) ||
        (node.fields && searchInArray(node.fields.fields, 'fields.fields')) ||
        findNode(node.left, targetId, `${path}.left`) ||
        findNode(node.right, targetId, `${path}.right`) ||
        findNode(node.expression, targetId, `${path}.expression`) ||
        findNode(node.condition, targetId, `${path}.condition`) ||
        (node.body && node.body.type === 'STMT_LIST' && node.body.statements
          ? searchInArray(node.body.statements, 'body.statements')
          : findNode(node.body, targetId, `${path}.body`)) ||
        (node.thenBody && node.thenBody.type === 'STMT_LIST' && node.thenBody.statements
          ? searchInArray(node.thenBody.statements, 'thenBody.statements')
          : findNode(node.thenBody, targetId, `${path}.thenBody`)) ||
        (node.elseBody && node.elseBody.type === 'STMT_LIST' && node.elseBody.statements
          ? searchInArray(node.elseBody.statements, 'elseBody.statements')
          : findNode(node.elseBody, targetId, `${path}.elseBody`)) ||
        (node.defaultBlock && node.defaultBlock.type === 'STMT_LIST' && node.defaultBlock.statements
          ? searchInArray(node.defaultBlock.statements, 'defaultBlock.statements')
          : findNode(node.defaultBlock, targetId, `${path}.defaultBlock`)) ||
        findNode(node.object, targetId, `${path}.object`) ||
        findNode(node.field, targetId, `${path}.field`) ||
        findNode(node.identifier, targetId, `${path}.identifier`) ||
        findNode(node.dataType, targetId, `${path}.dataType`) ||
        findNode(node.assignmentOp, targetId, `${path}.assignmentOp`) ||
        findNode(node.target, targetId, `${path}.target`) ||
        findNode(node.keyword, targetId, `${path}.keyword`) ||
        findNode(node.returnType, targetId, `${path}.returnType`) ||
        findNode(node.returnStatement, targetId, `${path}.returnStatement`) ||
        findNode(node.step, targetId, `${path}.step`) ||
        (typeof node.value === 'object' && findNode(node.value, targetId, `${path}.value`))
      );
    };
    
    const result = findNode(ast, selectedNode);
    return result;
  };

  const nodeDetails = getNodeDetails();

  return (
    <div className="w-full p-4 flex justify-center items-start h-full">
      <div className="w-full max-w-6xl h-full flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full flex-1 min-h-0">
          {/* AST Tree View */}
          <div className="lg:col-span-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Abstract Syntax Tree
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedNodes(new Set())}
                    className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Collapse All
                  </button>
                  <button
                    onClick={() => {
                      const allNodeIds = [];
                      const collectIds = (node, path = '') => {
                        if (!node) return;
                        const nodeId = getNodeId(node, path);
                        allNodeIds.push(nodeId);
                        
                        if (node.children) node.children.forEach((child, i) => collectIds(child, `${path}.children.${i}`));
                        if (node.statements && node.statements.statements) node.statements.statements.forEach((stmt, i) => collectIds(stmt, `${path}.statements.statements.${i}`));
                        if (node.items) node.items.forEach((item, i) => collectIds(item, `${path}.items.${i}`));
                        if (node.args) node.args.forEach((arg, i) => collectIds(arg, `${path}.args.${i}`));
                        if (node.elements) node.elements.forEach((el, i) => collectIds(el, `${path}.elements.${i}`));
                        if (node.elseIfs) node.elseIfs.forEach((elif, i) => collectIds(elif, `${path}.elseIfs.${i}`));
                        if (node.cases) node.cases.forEach((case_, i) => collectIds(case_, `${path}.cases.${i}`));
                        if (node.content) node.content.forEach((contentItem, i) => collectIds(contentItem, `${path}.content.${i}`));
                        if (node.parameters && node.parameters.params) node.parameters.params.forEach((param, i) => collectIds(param, `${path}.parameters.params.${i}`));
                        if (node.arguments && node.arguments.args) node.arguments.args.forEach((arg, i) => collectIds(arg, `${path}.arguments.args.${i}`));
                        if (node.fields && node.fields.fields) node.fields.fields.forEach((field, i) => collectIds(field, `${path}.fields.fields.${i}`));
                        if (node.left) collectIds(node.left, `${path}.left`);
                        if (node.right) collectIds(node.right, `${path}.right`);
                        if (node.expression) collectIds(node.expression, `${path}.expression`);
                        if (node.condition) collectIds(node.condition, `${path}.condition`);
                        if (node.body) {
                          if (node.body.type === 'STMT_LIST' && node.body.statements) {
                            node.body.statements.forEach((stmt, i) => collectIds(stmt, `${path}.body.statements.${i}`));
                          } else {
                            collectIds(node.body, `${path}.body`);
                          }
                        }
                        if (node.thenBody) {
                          if (node.thenBody.type === 'STMT_LIST' && node.thenBody.statements) {
                            node.thenBody.statements.forEach((stmt, i) => collectIds(stmt, `${path}.thenBody.statements.${i}`));
                          } else {
                            collectIds(node.thenBody, `${path}.thenBody`);
                          }
                        }
                        if (node.elseBody) {
                          if (node.elseBody.type === 'STMT_LIST' && node.elseBody.statements) {
                            node.elseBody.statements.forEach((stmt, i) => collectIds(stmt, `${path}.elseBody.statements.${i}`));
                          } else {
                            collectIds(node.elseBody, `${path}.elseBody`);
                          }
                        }
                        if (node.defaultBlock) {
                          if (node.defaultBlock.type === 'STMT_LIST' && node.defaultBlock.statements) {
                            node.defaultBlock.statements.forEach((stmt, i) => collectIds(stmt, `${path}.defaultBlock.statements.${i}`));
                          } else {
                            collectIds(node.defaultBlock, `${path}.defaultBlock`);
                          }
                        }
                        if (node.object) collectIds(node.object, `${path}.object`);
                        if (node.field) collectIds(node.field, `${path}.field`);
                        if (node.identifier) collectIds(node.identifier, `${path}.identifier`);
                        if (node.dataType) collectIds(node.dataType, `${path}.dataType`);
                        if (node.assignmentOp) collectIds(node.assignmentOp, `${path}.assignmentOp`);
                        if (node.target) collectIds(node.target, `${path}.target`);
                        if (node.keyword) collectIds(node.keyword, `${path}.keyword`);
                        if (node.returnType) collectIds(node.returnType, `${path}.returnType`);
                        if (node.returnStatement) collectIds(node.returnStatement, `${path}.returnStatement`);
                        if (node.step) collectIds(node.step, `${path}.step`);
                        if (typeof node.value === 'object') collectIds(node.value, `${path}.value`);
                      };
                      collectIds(ast);
                      setExpandedNodes(new Set(allNodeIds));
                    }}
                    className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Expand All
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-vertical-scrollbar">
              {renderNode(ast)}
            </div>
          </div>

          {/* Node Details Panel */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Node Details
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-vertical-scrollbar">
              {nodeDetails ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getNodeIcon(nodeDetails.node.type)}
                      <span className={`font-mono font-medium ${getNodeColor(nodeDetails.node.type)}`}>
                        {safeToString(nodeDetails.node.type)}
                      </span>
                    </div>
                  </div>
                  
                  {nodeDetails.node.name && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</span>
                      <div className="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                        {safeToString(nodeDetails.node.name)}
                      </div>
                    </div>
                  )}
                  
                  {nodeDetails.node.value !== undefined && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</span>
                      <div className="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                        {safeToDisplayString(nodeDetails.node.value)}
                      </div>
                    </div>
                  )}
                  
                  {nodeDetails.node.operator && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Operator</span>
                      <div className="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                        {safeToString(nodeDetails.node.operator)}
                      </div>
                    </div>
                  )}
                  
                  {nodeDetails.node.token && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</span>
                      <div className="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                        Line {nodeDetails.node.token.line || 0}, Column {nodeDetails.node.token.column || 0}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Path</span>
                    <div className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                      {safeToString(nodeDetails.path)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a node to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AbstractSyntaxTree;
