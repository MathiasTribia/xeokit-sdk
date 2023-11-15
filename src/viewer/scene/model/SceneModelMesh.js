/**
 * A mesh within a {@link SceneModel}.
 *
 * * Created with {@link SceneModel#createMesh}
 * * Belongs to exactly one {@link SceneModelEntity}
 * * Stored by ID in {@link SceneModel#meshes}
 * * Referenced by {@link SceneModelEntity#meshes}
 * * Can have a {@link SceneModelTransform} to dyncmically scale, rotate and translate it.
 */
export class SceneModelMesh {

    /**
     * @private
     */
    constructor(model, id, color, opacity, transform, textureSet, layer = null, portionId = 0) {

        this.model = model;

        /**
         * The {@link SceneModelEntity} that owns this SceneModelMesh.
         *
         * @type {SceneModelEntity}
         */
        this.object = null;

        this.parent = null;

        /**
         * The {@link SceneModelTransform} that transforms this SceneModelMesh.
         *
         * * This only exists when the SceneModelMesh is instancing its geometry.
         * * These are created with {@link SceneModel#createTransform}
         * * Each of these is also registered in {@ilnk SceneModel#transforms}.
         *
         * @type {SceneModelTransform}
         */
        this.transform = transform;


        /**
         * The {@link SceneModelTextureSet} that optionally textures this SceneModelMesh.
         *
         * * This only exists when the SceneModelMesh has texture.
         * * These are created with {@link SceneModel#createTextureSet}
         * * Each of these is also registered in {@link SceneModel#textureSets}.
         *
         * @type {SceneModelTextureSet}
         */
        this.textureSet = textureSet;

        this._matrixDirty = false;
        this._matrixUpdateScheduled = false;

        /**
         * Unique ID of this SceneModelMesh.
         *
         * The SceneModelMesh is registered against this ID in {@link SceneModel#meshes}.
         */
        this.id = id;

        this._aabb = null;
        this.layer = layer;
        this.portionId = portionId;
        this._color = new Uint8Array([color[0], color[1], color[2], opacity]); // [0..255]
        this._colorize = new Uint8Array([color[0], color[1], color[2], opacity]); // [0..255]
        this._colorizing = false;
        this._transparent = (opacity < 255);
        this.numTriangles = 0;
        this.origin = null;
        if (transform) {
            transform._addMesh(this);
        }
    }

    _setMatrixDirty() {
        if (!this._matrixDirty && !this._matrixUpdateScheduled) {
            this.model._meshMatrixDirty(this);
            this._matrixDirty = true;
            this._matrixUpdateScheduled = true;
        }
    }

    _updateMatrix() {
        if (this.transform && this._matrixDirty) {
            this.layer.setMatrix(this.portionId, this.transform.worldMatrix);
        }
        this._matrixDirty = false;
        this._matrixUpdateScheduled = false;
    }

    _finalize(entityFlags) {
        this.layer.initFlags(this.portionId, entityFlags, this._transparent);
    }

    _finalize2() {
        if (this.layer.flushInitFlags) {
            this.layer.flushInitFlags();
        }
    }

    _setVisible(entityFlags) {
        this.layer.setVisible(this.portionId, entityFlags, this._transparent);
    }

    _setColor(color) {
        this._color[0] = color[0];
        this._color[1] = color[1];
        this._color[2] = color[2];
        if (!this._colorizing) {
            this.layer.setColor(this.portionId, this._color, false);
        }
    }

    _setColorize(colorize) {
        const setOpacity = false;
        if (colorize) {
            this._colorize[0] = colorize[0];
            this._colorize[1] = colorize[1];
            this._colorize[2] = colorize[2];
            this.layer.setColor(this.portionId, this._colorize, setOpacity);
            this._colorizing = true;
        } else {
            this.layer.setColor(this.portionId, this._color, setOpacity);
            this._colorizing = false;
        }
    }

    _setOpacity(opacity, entityFlags) {
        const newTransparent = (opacity < 255);
        const lastTransparent = this._transparent;
        const changingTransparency = (lastTransparent !== newTransparent);
        this._color[3] = opacity;
        this._colorize[3] = opacity;
        this._transparent = newTransparent;
        if (this._colorizing) {
            this.layer.setColor(this.portionId, this._colorize);
        } else {
            this.layer.setColor(this.portionId, this._color);
        }
        if (changingTransparency) {
            this.layer.setTransparent(this.portionId, entityFlags, newTransparent);
        }
    }

    _setOffset(offset) {
        this.layer.setOffset(this.portionId, offset);
    }

    _setHighlighted(entityFlags) {
        this.layer.setHighlighted(this.portionId, entityFlags, this._transparent);
    }

    _setXRayed(entityFlags) {
        this.layer.setXRayed(this.portionId, entityFlags, this._transparent);
    }

    _setSelected(entityFlags) {
        this.layer.setSelected(this.portionId, entityFlags, this._transparent);
    }

    _setEdges(entityFlags) {
        this.layer.setEdges(this.portionId, entityFlags, this._transparent);
    }

    _setClippable(entityFlags) {
        this.layer.setClippable(this.portionId, entityFlags, this._transparent);
    }

    _setCollidable(entityFlags) {
        this.layer.setCollidable(this.portionId, entityFlags);
    }

    _setPickable(flags) {
        this.layer.setPickable(this.portionId, flags, this._transparent);
    }

    _setCulled(flags) {
        this.layer.setCulled(this.portionId, flags, this._transparent);
    }

    /**
     * @private
     */
    canPickTriangle() {
        return false;
    }

    /**
     * @private
     */
    drawPickTriangles(renderFlags, frameCtx) {
        // NOP
    }

    /**
     * @private
     */
    pickTriangleSurface(pickResult) {
        // NOP
    }

    /**
     * @private
     */
    precisionRayPickSurface(worldRayOrigin, worldRayDir, worldSurfacePos, worldSurfaceNormal) {
        return this.layer.precisionRayPickSurface ? this.layer.precisionRayPickSurface(this.portionId, worldRayOrigin, worldRayDir, worldSurfacePos, worldSurfaceNormal) : false;
    }

    /**
     * @private
     */
    canPickWorldPos() {
        return true;
    }

    /**
     * @private
     */
    drawPickDepths(frameCtx) {
        this.model.drawPickDepths(frameCtx);
    }

    /**
     * @private
     */
    drawPickNormals(frameCtx) {
        this.model.drawPickNormals(frameCtx);
    }

    /**
     * @private
     */
    delegatePickedEntity() {
        return this.parent;
    }

    /**
     * @private
     */
    getEachVertex(callback) {
        this.layer.getEachVertex(this.portionId, callback);
    }

    /**
     * @private
     */
    set aabb(aabb) { // Called by SceneModel
        this._aabb = aabb;
    }

    /**
     * @private
     */
    get aabb() { // called by SceneModelEntity
        return this._aabb;
    }

    /**
     * @private
     */
    _destroy() {
        this.model.scene._renderer.putPickID(this.pickId);
    }
}
