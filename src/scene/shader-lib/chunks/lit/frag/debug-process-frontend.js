export default /* glsl */`
#ifdef DEBUG_LIGHTING_PASS
litShaderArgs.albedo = vec3(0.5);
#endif

#ifdef DEBUG_UV0_PASS
litShaderArgs.albedo = vec3(vUv0, 0);
#endif
`;